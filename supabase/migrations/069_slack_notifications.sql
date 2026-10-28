-- ============================================================================
-- Slack: real-time posts to #physics-purchases and a morning report to
-- #physics-daily.
-- ============================================================================
-- Posts go straight from the database to Slack incoming webhooks through
-- pg_net; no API route. pg_net sends after commit, so a rolled-back write
-- posts nothing, and every post is wrapped so a Slack failure can never break
-- the Stripe webhook. Same design as Hooke's Log and Remo, which share the
-- "Ops Bot" Slack app.
--
-- Each channel's webhook URL lives in Vault. With no secret the post is
-- skipped, so an environment without them stays silent:
--   slack_webhook_physics_purchases  purchases, refunds, disputes, provisioning failures
--   slack_webhook_physics_daily      yesterday's numbers, 8am America/New_York
--   slack_label                      optional; e.g. 'physics staging' prefixes every message
--
-- New accounts are deliberately not posted on their own; they show up in the
-- daily report. So every real-time post is a trigger on a single row:
--   purchases      insert             new purchase (written by recordPurchase
--                                     after provisioning, so stripe_events and
--                                     touch_attribution already exist)
--   purchases      update             refund, dispute opened, dispute decided
--   stripe_events  insert/update      a paid checkout that failed to provision,
--                                     and the retry that fixes it
--
-- Preview without posting:
--   select private.slack_daily_report();               -- yesterday
--   select private.slack_daily_report('2026-10-27');   -- any day
--   select private.slack_purchase_message(p) from public.purchases p order by purchased_at desc limit 1;
-- ============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ============================================================
-- Posting
-- ============================================================
-- Slack mrkdwn treats &, < and > as control characters. Null stays null, so
-- optional parts can drop out with coalesce.
create function private.slack_escape(p text) returns text
language sql immutable set search_path = '' as $$
  select replace(replace(replace(p, '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
$$;

create function private.slack_post(p_channel text, p_text text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_url text;
  v_label text;
begin
  if p_text is null then
    return;
  end if;
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'slack_webhook_' || p_channel;
  if coalesce(v_url, '') = '' then
    return;
  end if;
  select decrypted_secret into v_label from vault.decrypted_secrets where name = 'slack_label';
  perform net.http_post(
    url := v_url,
    body := jsonb_build_object(
      'text', case when coalesce(v_label, '') <> '' then '[' || v_label || '] ' else '' end || p_text,
      'unfurl_links', false,
      'unfurl_media', false
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
exception when others then
  raise warning 'slack_post(%) failed: %', p_channel, sqlerrm;
end $$;

-- "Name (email)" from the account, flagged when it's an admin's own account.
-- Falls back to the email on the row when the account is gone or never existed.
create function private.slack_who(p_user uuid, p_email text) returns text
language sql stable security definer set search_path = '' as $$
  select private.slack_escape(
           coalesce(nullif(btrim(concat_ws(' ', u.raw_user_meta_data->>'first_name', u.raw_user_meta_data->>'last_name')), ''), 'No name')
           || ' (' || coalesce(u.email, p_email, 'no email') || ')')
    || case when coalesce((u.raw_user_meta_data->>'is_admin')::boolean, false) then ' _(admin account)_' else '' end
  from (select 1) one
  left join auth.users u on u.id = p_user
$$;

-- $39.00 for USD; EUR 35.00 for anything else.
create function private.slack_money(p_cents bigint, p_currency text default 'usd') returns text
language sql immutable set search_path = '' as $$
  select case when lower(coalesce(p_currency, 'usd')) = 'usd' then '$' else upper(p_currency) || ' ' end
    || to_char(p_cents / 100.0, 'FM999,999,990.00')
$$;

create function private.slack_date(p_at timestamptz) returns text
language sql immutable set search_path = '' as $$
  select to_char(p_at at time zone 'America/New_York', 'Mon FMDD')
$$;

-- What a purchase earned: settled USD once known, otherwise the presentment
-- amount (exact when it was already USD).
create function private.slack_purchase_amount(p public.purchases) returns text
language sql stable set search_path = '' as $$
  select case
    when p.settled_usd_cents is not null then private.slack_money(p.settled_usd_cents)
      || case when p.presentment_currency <> 'usd'
              then ' (paid ' || private.slack_money(p.presentment_amount_cents, p.presentment_currency) || ')' else '' end
    else private.slack_money(p.presentment_amount_cents, p.presentment_currency)
      || case when p.presentment_currency <> 'usd' then ', USD not settled yet' else '' end
  end
$$;

create function private.slack_product(p_webinar uuid, p_slug text) returns text
language sql stable security definer set search_path = '' as $$
  select private.slack_escape(coalesce(
    (select w.title from public.webinars w where w.id = p_webinar),
    p_slug,
    'unknown product'))
$$;

-- ============================================================
-- #physics-purchases: new purchase
-- ============================================================
-- Last touch is the most recent external referrer or UTM link; first touch is
-- the first page load ever, so it's "direct" for anyone who typed the URL.
create function private.slack_purchase_message(p public.purchases) returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  a public.touch_attribution;
  e public.stripe_events;
  v_last text;
  v_first text;
  v_source text;
  v_before int;
  v_offer text;
begin
  select * into a from public.touch_attribution where user_id = p.user_id;
  select * into e from public.stripe_events
  where session_id = p.stripe_session_id and event_type = 'checkout.session.completed'
  order by created_at desc limit 1;

  v_last := coalesce(nullif(concat_ws(' / ', a.last_utm_source, a.last_utm_medium, a.last_utm_campaign), ''),
                     'via ' || a.last_referrer_host);
  v_first := coalesce(nullif(concat_ws(' / ', a.first_utm_source, a.first_utm_medium, a.first_utm_campaign), ''),
                      'via ' || a.first_referrer_host);
  v_source := case
    when a.user_id is null then 'not recorded'
    else coalesce(v_last, v_first, 'direct (no referrer or UTM)')
      || case when v_last is not null and v_first is not null and v_first <> v_last
              then ', first visit ' || v_first else '' end
      || coalesce(', landed on ' || a.first_landing_path, '')
  end;

  select count(*) into v_before from public.purchases o
  where o.id <> p.id and o.purchased_at < p.purchased_at
    and (o.user_id = p.user_id or lower(o.email) = lower(p.email));

  if p.discount_cents > 0 then
    v_offer := private.slack_money(p.discount_cents, p.presentment_currency) || ' off';
  end if;

  return ':moneybag: *New purchase*'
    || E'\n*Buyer:* ' || private.slack_who(p.user_id, p.email)
    || E'\n*Product:* ' || private.slack_product(p.webinar_id, p.webinar_slug)
    || E'\n*Paid:* ' || private.slack_purchase_amount(p)
      || case p.pricing
           when 'early_bird' then ' · early bird'
           when 'offer' then ' · subscriber offer'
           when 'scholarship' then ' · scholarship'
           when 'bundle' then ' · bundle'
           else '' end
      || coalesce(' · ' || v_offer, '')
    || E'\n*Account:* ' || case p.user_state
         when 'new' then 'new account'
         when 'returning' then 'existing account, not signed in'
         when 'logged_in' then 'signed in'
         else 'unknown' end
      || case when v_before > 0
              then ', ' || v_before || case when v_before = 1 then ' earlier purchase' else ' earlier purchases' end
              else ', first purchase' end
    || E'\n*Source:* ' || private.slack_escape(v_source)
    || case when e.email_status = 'failed'
            then E'\n:warning: *Login email failed:* ' || coalesce(private.slack_escape(left(e.email_error, 200)), 'no error recorded')
            else '' end
    || case when e.status = 'kit_failed'
            then E'\n:warning: *Kit tagging failed:* ' || coalesce(private.slack_escape(left(e.error, 200)), 'no error recorded')
            else '' end;
end $$;

create function private.slack_purchase_inserted() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.slack_post('physics_purchases', private.slack_purchase_message(new));
  return new;
exception when others then
  raise warning 'slack_purchase_inserted(%) failed: %', new.id, sqlerrm;
  return new;
end $$;

create trigger slack_purchase_inserted
  after insert on public.purchases
  for each row execute function private.slack_purchase_inserted();

-- ============================================================
-- #physics-purchases: refunds and disputes
-- ============================================================
-- charge.refunded rewrites refund_usd_cents with the charge's running total,
-- so a partial refund followed by another posts twice, each with the total.
-- Disputes post when opened and when decided; the steps in between
-- (needs_response -> under_review) are Kaleen's own evidence submission.
create function private.slack_purchase_updated() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_closed constant text[] := array['won', 'lost', 'warning_closed', 'prevented'];
  v_what text;
  v_msg text;
begin
  -- Built here rather than in declare, where an error would escape the handler below.
  v_what := private.slack_who(new.user_id, new.email) || ' · '
    || private.slack_product(new.webinar_id, new.webinar_slug)
    || ', bought ' || private.slack_date(new.purchased_at);

  if new.refund_usd_cents > coalesce(old.refund_usd_cents, 0) then
    v_msg := ':leftwards_arrow_with_hook: *Refund:* ' || private.slack_money(new.refund_usd_cents)
      || ' of ' || private.slack_purchase_amount(new) || E'\n' || v_what;
  end if;

  if new.disputed_at is not null and old.disputed_at is null then
    v_msg := concat_ws(E'\n', v_msg,
      ':rotating_light: *Dispute opened:* ' || private.slack_purchase_amount(new)
      || coalesce(' (' || replace(new.dispute_status, '_', ' ') || ')', '')
      || E'\n' || v_what);
  elsif new.dispute_status = any(v_closed) and new.dispute_status is distinct from old.dispute_status then
    v_msg := concat_ws(E'\n', v_msg,
      case new.dispute_status
        when 'won' then ':white_check_mark: *Dispute won:* '
        when 'lost' then ':x: *Dispute lost:* '
        else ':white_check_mark: *Dispute closed (' || replace(new.dispute_status, '_', ' ') || '):* '
      end || private.slack_purchase_amount(new) || E'\n' || v_what);
  end if;

  perform private.slack_post('physics_purchases', v_msg);
  return new;
exception when others then
  raise warning 'slack_purchase_updated(%) failed: %', new.id, sqlerrm;
  return new;
end $$;

create trigger slack_purchase_updated
  after update of refund_usd_cents, disputed_at, dispute_status on public.purchases
  for each row
  when (old.refund_usd_cents is distinct from new.refund_usd_cents
        or old.disputed_at is distinct from new.disputed_at
        or old.dispute_status is distinct from new.dispute_status)
  execute function private.slack_purchase_updated();

-- ============================================================
-- #physics-purchases: provisioning failures (stripe_events)
-- ============================================================
-- api/stripe/webhook.js upserts the checkout.session.completed row as
-- 'failed' when provisionPurchase throws, and returns 500 so Stripe retries.
-- Each retry rewrites the same row, so only the first failure posts. The
-- retry that succeeds moves it to processed or kit_failed and posts the
-- recovery; the normal purchase post follows from recordPurchase.
create function private.slack_stripe_event_changed() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_old text;
  v_what text;
  v_msg text;
begin
  if new.event_type <> 'checkout.session.completed' then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    v_old := old.status;
  end if;
  v_what := private.slack_escape(coalesce(new.payload->'customer_details'->>'email', new.payload->'metadata'->>'email', 'no email'))
    || ' · ' || private.slack_product(new.webinar_id, new.payload->'metadata'->>'webinar_slug')
    || coalesce(' · ' || private.slack_money((new.payload->>'amount_total')::bigint, new.payload->>'currency'), '');

  if new.status = 'failed' and v_old is distinct from 'failed' then
    v_msg := ':rotating_light: *Paid checkout not provisioned:* ' || v_what
      || E'\n*Error:* ' || coalesce(private.slack_escape(left(new.error, 300)), 'none recorded')
      || E'\nStripe will retry; a recovery post follows if a retry works.';
  elsif v_old = 'failed' and new.status in ('processed', 'kit_failed') then
    v_msg := ':white_check_mark: *Provisioning recovered:* ' || v_what;
  end if;

  perform private.slack_post('physics_purchases', v_msg);
  return new;
exception when others then
  raise warning 'slack_stripe_event_changed(%) failed: %', new.event_id, sqlerrm;
  return new;
end $$;

create trigger slack_stripe_event_changed
  after insert or update of status on public.stripe_events
  for each row execute function private.slack_stripe_event_changed();

-- ============================================================
-- #physics-daily
-- ============================================================
-- One day in America/New_York, yesterday by default.
--
-- Sales are purchases by purchased_at, revenue as in admin_revenue_daily:
-- settled USD, or the presentment amount when it was USD. A foreign-currency
-- order still waiting for its settlement lookup is counted but not summed.
-- Refunds are by refunded_at, so a refund shows on the day it happened.
--
-- A new account's route in is its first entitlement within an hour of
-- creation: lead_magnet is the Spring Load Calculator claim, stripe is a
-- purchase, anything else (the Signup page, an admin grant) is "other".
-- Calculator claims count everyone granted the calculator that day, new
-- account or not.
--
-- Kit numbers come from daily_snapshots, written by api/cron/daily-snapshot.js
-- at 06:00 UTC, so the morning after the day being reported has a row by 8am
-- New York. Kit's new and cancelled counts are for the UTC day, and the
-- subscriber total is the whole Kit account (Hooke's Log shares it). When the
-- snapshot also carries a pp-emails tag count, that's shown as the Pilates
-- Physics list. Without a snapshot the line says so.
create function private.slack_daily_report(p_day date default null) returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  v_tz constant text := 'America/New_York';
  v_day date := coalesce(p_day, (now() at time zone v_tz)::date - 1);
  v_from timestamptz := v_day::timestamp at time zone v_tz;
  v_to timestamptz := (v_day + 1)::timestamp at time zone v_tz;
  v_orders int;
  v_gross bigint;
  v_unsettled int;
  v_products text;
  v_refunds int;
  v_refund_cents bigint;
  v_disputes int;
  v_accounts int;
  v_via_calc int;
  v_via_purchase int;
  v_total_accounts int;
  v_claims int;
  v_claims_new int;
  v_snap public.daily_snapshots;
  v_kit text;
begin
  select count(*),
         coalesce(sum(coalesce(p.settled_usd_cents,
                   case when p.presentment_currency = 'usd' then p.presentment_amount_cents end)), 0),
         count(*) filter (where p.settled_usd_cents is null and p.presentment_currency <> 'usd')
    into v_orders, v_gross, v_unsettled
  from public.purchases p
  where p.purchased_at >= v_from and p.purchased_at < v_to;

  select string_agg(label || case when n > 1 then ' ×' || n else '' end, ', ' order by n desc, label)
    into v_products
  from (select private.slack_product(p.webinar_id, p.webinar_slug) as label, count(*) as n
        from public.purchases p
        where p.purchased_at >= v_from and p.purchased_at < v_to
        group by 1) x;

  select count(*), coalesce(sum(p.refund_usd_cents), 0) into v_refunds, v_refund_cents
  from public.purchases p where p.refunded_at >= v_from and p.refunded_at < v_to;

  select count(*) into v_disputes
  from public.purchases p where p.disputed_at >= v_from and p.disputed_at < v_to;

  select count(*),
         count(*) filter (where first_source = 'lead_magnet'),
         count(*) filter (where first_source = 'stripe')
    into v_accounts, v_via_calc, v_via_purchase
  from (select u.id,
               (select e.source from public.user_entitlements e
                where e.user_id = u.id and e.granted_at < u.created_at + interval '1 hour'
                order by e.granted_at, e.source limit 1) as first_source
        from auth.users u
        where u.created_at >= v_from and u.created_at < v_to) x;

  select count(*) into v_total_accounts from auth.users where created_at < v_to;

  select count(distinct e.user_id),
         count(distinct e.user_id) filter (where u.created_at >= v_from)
    into v_claims, v_claims_new
  from public.user_entitlements e
  join auth.users u on u.id = e.user_id
  where e.source = 'lead_magnet' and e.granted_at >= v_from and e.granted_at < v_to;

  select * into v_snap from public.daily_snapshots where snapshot_date = v_day + 1;
  if found and v_snap.kit is not null and v_snap.kit->>'subscribers' is not null then
    v_kit := coalesce(to_char((v_snap.tags->>'pp-emails')::int, 'FM999,999,990') || ' on the Pilates Physics list · ', '')
      || to_char((v_snap.kit->>'subscribers')::int, 'FM999,999,990') || ' in the Kit account'
      || ' · +' || coalesce(v_snap.kit->>'new_1d', '?') || ' new, −' || coalesce(v_snap.kit->>'cancellations_1d', '?') || ' unsubscribed'
      || coalesce(' · ' || to_char((v_snap.tags->>'spring-calc')::int, 'FM999,999,990') || ' tagged spring-calc', '');
  else
    v_kit := 'unavailable (no daily snapshot'
      || case when found then ' Kit section' else '' end || ' for ' || to_char(v_day + 1, 'Mon FMDD') || ')';
  end if;

  return '*Pilates Physics · ' || to_char(v_day, 'Dy Mon FMDD') || '*'
    || E'\n:moneybag: *Sales:* ' || v_orders || case when v_orders = 1 then ' order' else ' orders' end
      || case when v_orders > 0
              then ' · ' || private.slack_money(v_gross)
                || case when v_unsettled > 0 then ' (+' || v_unsettled || ' not settled in USD yet)' else '' end
                || ' · ' || v_products
              else '' end
    || case when v_refunds + v_disputes > 0
            then E'\n:leftwards_arrow_with_hook: *Refunds and disputes:* ' || concat_ws(', ',
                   case when v_refunds > 0 then v_refunds || case when v_refunds = 1 then ' refund' else ' refunds' end
                     || ' (' || private.slack_money(v_refund_cents) || ')' end,
                   case when v_disputes > 0 then v_disputes || case when v_disputes = 1 then ' dispute opened' else ' disputes opened' end end)
            else '' end
    || E'\n:seedling: *New accounts:* ' || v_accounts
      || case when v_accounts > 0
              then ' (' || concat_ws(', ',
                     case when v_via_calc > 0 then v_via_calc || ' from the calculator' end,
                     case when v_via_purchase > 0 then v_via_purchase || ' from a purchase' end,
                     case when v_accounts - v_via_calc - v_via_purchase > 0
                          then (v_accounts - v_via_calc - v_via_purchase) || ' other' end) || ')'
              else '' end
      || ' · ' || to_char(v_total_accounts, 'FM999,999,990') || ' total'
    || E'\n:abacus: *Spring calculator claims:* ' || v_claims
      || case when v_claims > 0 then ' (' || v_claims_new || ' new to us)' else '' end
    || E'\n:email: *Kit:* ' || v_kit;
end $$;

revoke execute on all functions in schema private from public, anon, authenticated;

-- ============================================================
-- Schedule
-- ============================================================
-- Hourly, posting only in the 8am hour New York time, so it stays at 8am across DST.
select cron.schedule('slack-daily-report', '0 * * * *', $cron$
  select private.slack_post('physics_daily', private.slack_daily_report())
  where extract(hour from now() at time zone 'America/New_York') = 8
$cron$);
