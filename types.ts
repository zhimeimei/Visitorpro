export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id: string;
  username: string;
  loginCode: string; // The specific code required to login
  role: UserRole;
  name: string;
}

export interface ItineraryItem {
  id: string;
  time: string; // HH:mm or range
  date: string; // YYYY-MM-DD
  activity: string;
  location: string;
  involvedPeople: string[]; // e.g., ['Teacher', 'Director']
  isKeyNode: boolean; // Highlights important events
}

// Changed from fixed object to dynamic array
export interface ChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
  details: string;
  category?: 'hotel' | 'vehicle' | 'gifts' | 'other' | 'custom';
}

export interface Visit {
  id: string;
  visitorName: string;
  visitorTitle?: string; // e.g. "Professor", "CEO"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  color: string; // For calendar visualization
  liaison: string; // "小天使" / Contact person
  accommodation: string;
  checklist: ChecklistItem[]; // Array instead of object
  itinerary: ItineraryItem[];
}

export interface DateCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Visit[];
}