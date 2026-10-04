// Qatar GIS Census Zone 2020 layer: zone numbers grouped by official municipality.
// Source: https://services.gisqatar.org.qa/server/rest/services/Vector/Census_Zone/MapServer/0
// Data retrieved 4 October 2026. Do not infer missing zone numbers from numeric ranges.
export const QATAR_MUNICIPALITIES = [
  {
    "name": "Al Daayen Municipality",
    "name_ar": "بلدية الظعاين",
    "zones": [
      69,
      70
    ]
  },
  {
    "name": "Al Khor and Al Thakhira Municipality",
    "name_ar": "بلدية الخور والذخيرة",
    "zones": [
      74,
      75,
      76
    ]
  },
  {
    "name": "Al Rayyan Municipality",
    "name_ar": "بلدية الريان",
    "zones": [
      51,
      52,
      53,
      54,
      55,
      56,
      81,
      83,
      96,
      97
    ]
  },
  {
    "name": "Al Shamal Municipality",
    "name_ar": "بلدية الشمال",
    "zones": [
      77,
      78,
      79,
      99
    ]
  },
  {
    "name": "Al Sheehaniya Municipality",
    "name_ar": "بلدية الشيحانية",
    "zones": [
      72,
      73,
      80,
      82,
      84,
      85,
      86
    ]
  },
  {
    "name": "Al Wakra Municipality",
    "name_ar": "بلدية الوكرة",
    "zones": [
      90,
      91,
      92,
      93,
      94,
      95,
      98
    ]
  },
  {
    "name": "Doha Municipality",
    "name_ar": "بلدية الدوحة",
    "zones": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23,
      24,
      25,
      26,
      27,
      28,
      29,
      30,
      31,
      32,
      33,
      34,
      35,
      36,
      37,
      38,
      39,
      40,
      41,
      42,
      43,
      44,
      45,
      46,
      47,
      48,
      49,
      50,
      57,
      58,
      60,
      61,
      62,
      63,
      64,
      65,
      66,
      67,
      68
    ]
  },
  {
    "name": "Umm Slal Municipality",
    "name_ar": "بلدية أم صلال",
    "zones": [
      71
    ]
  }
] as const;

export function municipalityForZone(zone: string | number) {
  return QATAR_MUNICIPALITIES.find((municipality) => municipality.zones.some((candidate) => candidate === Number(zone)));
}
