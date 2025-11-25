
import { ItineraryItem } from '../types';

export const parseSmartItinerary = (text: string, startDateContext: string): ItineraryItem[] => {
  if (!text.trim()) return [];

  const lines = text.split('\n');
  const newItems: ItineraryItem[] = [];
  let lastDate = startDateContext; // Context date (usually visit start date)

  lines.forEach((line, index) => {
    const textStr = line.trim();
    if (!textStr) return;

    // 1. Detect Date (YYYY-MM-DD or M月D日)
    const dateRegex1 = /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/;
    const dateRegex2 = /(\d{1,2})月(\d{1,2})日?/;
    
    const match1 = textStr.match(dateRegex1);
    const match2 = textStr.match(dateRegex2);

    let dateFoundInLine = false;

    if (match1) {
      lastDate = `${match1[1]}-${match1[2].padStart(2, '0')}-${match1[3].padStart(2, '0')}`;
      dateFoundInLine = true;
    } else if (match2) {
      const year = new Date().getFullYear();
      lastDate = `${year}-${match2[1].padStart(2, '0')}-${match2[2].padStart(2, '0')}`;
      dateFoundInLine = true;
    }

    // Remove date from textStr to avoid parsing numbers in date as time
    let tempStr = textStr.replace(dateRegex1, '').replace(dateRegex2, '').trim();

    // 2. Detect Time (HH:MM)
    let time = '待定';
    const timeRegex = /(\d{1,2}[:：]\d{2})(-\d{1,2}[:：]\d{2})?/;
    const timeMatch = tempStr.match(timeRegex);
    if (timeMatch) {
      time = timeMatch[0].replace('：', ':');
      tempStr = tempStr.replace(timeRegex, '').trim();
    } else {
      // If no time found, and this line *only* contained a date, skip
      if (dateFoundInLine && tempStr.length === 0) {
        return; 
      }
    }

    // 3. Extract Tags/Involved People from Parentheses (e.g., (张三), (老师))
    const involvedPeople: string[] = [];
    
    // Regex to find content inside () or （）
    const parentheticalRegex = /[（(](.*?)[)）]/g;
    let match;
    // Use tempStr which has date/time removed
    while ((match = parentheticalRegex.exec(tempStr)) !== null) {
      const content = match[1].trim();
      if (content) {
        if (content.includes('老师') || content.toLowerCase().includes('teacher')) {
            if (!involvedPeople.includes('Teacher')) involvedPeople.push('Teacher');
        } else {
            // Add other names found in brackets
            involvedPeople.push(content);
        }
      }
    }

    // 4. Clean Activity Text
    // Completely remove the brackets and their content from the display text
    let activity = tempStr.replace(parentheticalRegex, '').trim();
    
    // Clean up any double spaces or leading punctuation left over
    activity = activity.replace(/^[,\.\、，。]/, '').trim();
    
    if (!activity) activity = "行程安排";

    newItems.push({
      id: `parsed-${Date.now()}-${index}`,
      date: lastDate,
      time,
      activity,
      location: '现场', // Default
      involvedPeople,
      isKeyNode: involvedPeople.length > 0
    });
  });

  return newItems;
};

// Helper to group items by date string
export const groupItineraryByDate = (items: ItineraryItem[]) => {
  const groups: { [date: string]: ItineraryItem[] } = {};
  
  // Sort items first
  const sorted = [...items].sort((a, b) => {
    const da = new Date(`${a.date}T${a.time.split('-')[0].replace(':', ':')}:00`).getTime() || 0;
    const db = new Date(`${b.date}T${b.time.split('-')[0].replace(':', ':')}:00`).getTime() || 0;
    return da - db;
  });

  sorted.forEach(item => {
    if (!groups[item.date]) {
      groups[item.date] = [];
    }
    groups[item.date].push(item);
  });
  
  return groups;
};
