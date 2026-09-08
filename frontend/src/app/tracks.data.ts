/**
 * AZM Squad — Full Stack Enablement Program.
 *
 * Static reference data taken from the program deck. It is deliberately not fetched from the
 * CRM API: the tracks are an organisational fact about the team building this system, not
 * customer data, and the API has no endpoint for them.
 */

export interface TrackMember {
  name: string;
  phone: string;
  email: string;
}

export interface Track {
  /** Short code shown in the track badge, as printed in the deck. */
  code: string;
  name: string;
  description: string;
  /** Accent used for the badge so each track is recognisable at a glance. */
  accent: string;
  members: TrackMember[];
}

export const TRACKS: Track[] = [
  {
    code: 'PHP',
    name: 'PHP',
    description: 'Backend engineers strengthening modern PHP practices and frameworks.',
    accent: '#4F5B93',
    members: [
      { name: 'Mohamed Saeed', phone: '01067263214', email: 'mohamedsaeed@azmsquad.com' },
      { name: 'Mohamed Ragab', phone: '01113138415', email: 'mohamedragab.abdelhady@azmsquad.com' },
      { name: 'Mohammed Tantawy', phone: '+20 10 00589681', email: 'moh.altantawi@azm.com' },
    ],
  },
  {
    code: 'PY',
    name: 'Python',
    description: 'Building backend and automation expertise with Python.',
    accent: '#3776AB',
    members: [
      { name: 'Moamen Yousry', phone: '+201060900865', email: 'moamen.yousry@azm.sa' },
      { name: 'Mohammed Tantawy', phone: '+20 10 00589681', email: 'moh.altantawi@azm.com' },
    ],
  },
  {
    code: 'JS',
    name: 'Node.js',
    description: 'Growing server-side JavaScript capability with Node.js.',
    accent: '#5FA04E',
    members: [
      { name: 'Ahmed Elmonshareh', phone: '+201090405045', email: 'Ahmed.elmonshareh@azm.com' },
      { name: 'Alaa Abdelmotelb', phone: '+201012824086', email: 'alaa.abdelmotlep@azm.com' },
    ],
  },
  {
    code: 'R',
    name: 'React',
    description: 'Frontend engineers mastering component-driven UI with React.',
    accent: '#087EA4',
    members: [
      { name: 'Mohamed Tarek', phone: '01153991813', email: 'mohamedtarek@azmsquad.com' },
      { name: 'Ebtisam Ali Megahed', phone: '+201021790482', email: 'ebtsam.megahed@azm.com' },
      { name: 'Ahmed Mohamed Fathy Omda', phone: '01029190137', email: 'ahmedelomda@azmsquad.com' },
    ],
  },
  {
    code: 'V',
    name: 'Vue',
    description: 'Expanding frontend versatility with the Vue ecosystem.',
    accent: '#41B883',
    members: [
      { name: 'Ebtisam Ali Megahed', phone: '01021790482', email: 'ebtsam.megahed@azm.com' },
      { name: 'Mohamed Akl', phone: '01090456161', email: 'Mohamed.Akl@azm.com' },
    ],
  },
  {
    code: '.NET',
    name: '.NET',
    description: 'Backend engineers advancing enterprise development with .NET.',
    accent: '#512BD4',
    members: [
      { name: 'Esraa Gamal', phone: '01158565647', email: 'esraa.gamal@azmsquad.com' },
      { name: 'Esraa Nageh Shahat', phone: '01061439918', email: 'a.esraa@azmsquad.com' },
      { name: 'Faten Ahmed Abdel Wahab', phone: '01069008965', email: 'fatenahmed@azmsquad.com' },
    ],
  },
  {
    code: 'NG',
    name: 'Angular',
    description: 'Frontend engineers building structured, scalable UIs with Angular.',
    accent: '#DD0031',
    members: [
      { name: 'Mahmoud Saeed Hassan Abdelhamid', phone: '01066910022', email: 'MahmoudSaeed@azmsquad.com' },
      { name: 'Mahmoud Abdallah Mahmoud Dawod', phone: '01111309423', email: 'MahmoudAbdallah@azmsquad.com' },
      { name: 'Mohamed Akl', phone: '01090456161', email: 'Mohamed.Akl@azm.com' },
    ],
  },
  {
    code: 'AI',
    name: 'AI',
    description: 'Advancing AI and Machine Learning capabilities.',
    accent: '#B45309',
    members: [
      { name: 'Ibrahim Abdelbaki Ibrahim Baghdad', phone: '01020304605', email: 'Ibrahim.abdelbaki@azm.com' },
      { name: 'Ahmed Mohamed Fathy Omda', phone: '01029190137', email: 'ahmedelomda@azmsquad.com' },
    ],
  },
];

/** Initials for the member avatar — first and last word, matching the deck's badges. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}
