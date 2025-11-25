
import { Visit, User, UserRole, ItineraryItem } from '../types';

// Initial Mock Data
const INITIAL_USERS: User[] = [
  { id: '1', username: 'admin', loginCode: '888888', role: UserRole.ADMIN, name: '管理员' },
  { id: '2', username: 'staff', loginCode: '123456', role: UserRole.USER, name: '接待专员' }
];

const INITIAL_VISITS: Visit[] = [
  {
    id: 'v1',
    visitorName: '李教授',
    visitorTitle: '某高校院长',
    startDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0], // Tomorrow
    endDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0],
    color: 'bg-zen-500',
    liaison: '小张',
    accommodation: '迎宾楼 302',
    checklist: [
      { id: 'c1', title: '住宿预订', isCompleted: true, details: '已预订含早', category: 'hotel' },
      { id: 'c2', title: '车辆安排', isCompleted: false, details: '需安排GL8', category: 'vehicle' },
      { id: 'c3', title: '礼物准备', isCompleted: true, details: '茶叶礼盒', category: 'gifts' },
      { id: 'c4', title: '欢迎牌', isCompleted: false, details: '制作中', category: 'other' }
    ],
    itinerary: [
      {
        id: 'i1',
        date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
        time: '14:00 - 15:30',
        activity: '参观实验室',
        location: '科研楼A座',
        involvedPeople: ['Teacher'],
        isKeyNode: true
      },
      {
        id: 'i2',
        date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0],
        time: '09:00 - 11:00',
        activity: '座谈交流会',
        location: '行政楼会议室',
        involvedPeople: ['Teacher', 'Director'],
        isKeyNode: true
      }
    ]
  },
  {
    id: 'v2',
    visitorName: '王总一行',
    visitorTitle: '合作伙伴',
    startDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 4)).toISOString().split('T')[0],
    color: 'bg-wood-500',
    liaison: '小李',
    accommodation: '合作酒店',
    checklist: [
      { id: 'c1', title: '住宿预订', isCompleted: true, details: '大床房x2', category: 'hotel' },
      { id: 'c2', title: '车辆安排', isCompleted: true, details: '考斯特', category: 'vehicle' },
      { id: 'c3', title: '礼物准备', isCompleted: false, details: '待定', category: 'gifts' },
      { id: 'c4', title: '欢迎牌', isCompleted: true, details: '已完成', category: 'other' }
    ],
    itinerary: []
  }
];

const STORAGE_KEYS = {
  USERS: 'visitor_pro_users',
  VISITS: 'visitor_pro_visits_v2', // Changed key to force refresh data structure
  CURRENT_USER: 'visitor_pro_current_user'
};

class DataService {
  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    // Check if new storage key exists, if not, load new initial data (migration strategy: easy way)
    if (!localStorage.getItem(STORAGE_KEYS.VISITS)) {
      localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(INITIAL_VISITS));
    }
  }

  // Auth Methods
  login(username: string, code: string): User | null {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find((u: User) => u.username === username && u.loginCode === code);
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    return null;
  }

  logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  getCurrentUser(): User | null {
    const u = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return u ? JSON.parse(u) : null;
  }

  // User Management Methods
  getUsers(): User[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  }

  saveUser(user: User) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    // If updating current user, update session too
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === user.id) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  }

  deleteUser(id: string) {
    const users = this.getUsers();
    // Prevent deleting the last admin
    const userToDelete = users.find(u => u.id === id);
    if(userToDelete?.role === UserRole.ADMIN) {
         const admins = users.filter(u => u.role === UserRole.ADMIN);
         if (admins.length <= 1) {
             throw new Error("无法删除：系统中必须保留至少一个管理员账号");
         }
    }
    
    const updatedUsers = users.filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
  }

  // Visit Methods
  getVisits(): Visit[] {
    const data = localStorage.getItem(STORAGE_KEYS.VISITS);
    if (!data) return [];
    try {
        return JSON.parse(data);
    } catch(e) {
        return [];
    }
  }

  saveVisit(visit: Visit) {
    const visits = this.getVisits();
    const index = visits.findIndex(v => v.id === visit.id);
    if (index >= 0) {
      visits[index] = visit;
    } else {
      visits.push(visit);
    }
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
  }
  
  // New method for batch import
  addVisits(newVisits: Visit[]) {
    const visits = this.getVisits();
    const updatedVisits = [...visits, ...newVisits];
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(updatedVisits));
  }

  deleteVisit(id: string) {
    const visits = this.getVisits();
    const updatedVisits = visits.filter(v => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(updatedVisits));
  }
  
  // Helper to find visits in range
  getVisitsInRange(startDate: Date, endDate: Date): Visit[] {
    const visits = this.getVisits();
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    return visits.filter(v => {
      // Simple string comparison works for YYYY-MM-DD
      return (v.startDate <= endStr && v.endDate >= startStr);
    });
  }
}

export const dataService = new DataService();