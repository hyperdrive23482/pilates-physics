// Rough cross-brand spring equivalents, one chart per apparatus.
// Cells reference springs by their `color` key in springSpecs.json so chip
// colors and labels always resolve from the calculator's dataset.
//
// Reformer maps by tension tier (mirrors the blog post's conversion grid).
// Tower maps by job: the springs are functional types, not weights, and
// Merrithew's Roll-Down lists with the arm springs where its curve sits
// closest. Chair maps by position in each brand's lineup (light vs heavy),
// not by matched load.

export const CONVERSION_CHARTS = [
  {
    apparatusId: 'reformer',
    columns: ['Very Light', 'Light', 'Medium', 'Heavy'],
    rows: [
      { brandId: 'balanced-body', cells: [['yellow'], ['blue'], ['red'], ['green']] },
      { brandId: 'stott', cells: [['white'], ['blue'], ['red'], ['black']] },
      { brandId: 'align-pilates', cells: [['yellow'], ['blue'], ['red'], ['green']] },
      { brandId: 'peak-pilates', cells: [['green'], ['blue'], ['yellow'], ['red']] },
      { brandId: 'basi', cells: [['yellow'], ['blue'], ['red'], []] },
      { brandId: 'gratz', cells: [[], [], ['standard'], ['long-neck']] },
      { brandId: 'elina', cells: [['yellow'], ['green'], [], ['red']] },
    ],
    note: 'BASI stops at three springs, so its heaviest lands in the medium column. Gratz’s standard spring sits there too, with its Long Neck spring in heavy. Elina’s springs are placed by measured load, not their names: its Medium green loads like a light spring, and its Strong red lands in heavy.',
  },
  {
    apparatusId: 'tower',
    columns: ['Arm (Short)', 'Arm (Long)', 'Leg', 'Push-Thru', 'Trapeze'],
    rows: [
      {
        brandId: 'balanced-body',
        cells: [['yellow-short'], ['yellow-long'], ['purple-long'], ['blue-short', 'red-short'], ['black-short']],
      },
      {
        brandId: 'merrithew',
        cells: [['arm', 'roll-down'], [], ['leg', 'leg-enhanced'], ['push-thru'], ['trapeze']],
      },
      {
        brandId: 'basi',
        cells: [['yellow-short'], ['yellow-long'], ['purple-long'], ['blue-short', 'red-short'], ['black']],
      },
      {
        brandId: 'gratz',
        labels: true,
        cells: [['arm'], [], ['leg', 'roll-down'], ['push-thru'], []],
      },
    ],
    note: 'Tower springs group by job rather than weight. Merrithew’s Roll-Down spring is listed with the arm springs, where its load curve sits closest. Gratz’s Roll Down spring loads almost exactly like Merrithew’s Leg spring, so it sits in the leg column.',
  },
  {
    apparatusId: 'chair',
    columns: ['Light', 'Heavy'],
    rows: [
      { brandId: 'balanced-body', cells: [['white-short'], ['black-short']] },
      { brandId: 'merrithew', cells: [['push-thru'], ['trapeze']] },
      { brandId: 'basi', cells: [['yellow-short'], ['black']] },
      { brandId: 'gratz', span: true, labels: true, cells: [['wunda', 'electric']] },
    ],
    note: 'These pair each brand’s lighter and heavier chair option, not matched loads. BASI’s yellow runs far lighter than the other light chair springs. Gratz makes one spring for each of its two chairs, so it isn’t split into light and heavy.',
  },
]
