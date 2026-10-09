import { differenceInDays, differenceInSeconds, parseISO, addYears, isAfter, isSameDay } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

// Múi giờ mặc định
export const TIMEZONE = "Asia/Ho_Chi_Minh";

/**
 * Tính số ngày yêu nhau (ngày bắt đầu tính là ngày 1)
 */
export function getDaysTogether(startDateStr: string): number {
  const start = parseISO(startDateStr);
  const now = new Date();
  
  // Tránh đếm âm nếu ngày bắt đầu ở tương lai
  if (isAfter(start, now)) return 0;
  
  // Tính khoảng cách theo ngày (không quan tâm giờ giấc)
  const diff = differenceInDays(
    new Date(formatInTimeZone(now, TIMEZONE, "yyyy-MM-dd'T'00:00:00")),
    new Date(formatInTimeZone(start, TIMEZONE, "yyyy-MM-dd'T'00:00:00"))
  );
  
  return diff + 1; // Tính ngày đầu tiên là ngày 1
}

/**
 * Tính chi tiết thời gian (ngày, giờ, phút, giây) từ ngày bắt đầu
 */
export function getExactTimeTogether(startDateStr: string) {
  const start = parseISO(startDateStr);
  const now = new Date();
  
  if (isAfter(start, now)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  
  const diffSecs = differenceInSeconds(now, start);
  
  const days = Math.floor(diffSecs / (3600 * 24));
  const hours = Math.floor((diffSecs % (3600 * 24)) / 3600);
  const minutes = Math.floor((diffSecs % 3600) / 60);
  const seconds = diffSecs % 60;
  
  // Cộng 1 ngày nếu tính mốc ngày đầu = 1
  return { days: days + 1, hours, minutes, seconds };
}

/**
 * Tính mốc kỷ niệm tiếp theo (ví dụ: kỷ niệm 1 năm, kỷ niệm 1000 ngày)
 */
export function getNextMilestone(startDateStr: string) {
  const start = parseISO(startDateStr);
  const now = new Date();
  
  // 1. Tìm mốc năm (anniversary)
  let nextAnniversary = addYears(start, 1);
  let yearCount = 1;
  while (isAfter(now, nextAnniversary) || isSameDay(now, nextAnniversary)) {
    yearCount++;
    nextAnniversary = addYears(start, yearCount);
  }
  
  // 2. Tìm mốc số ngày (1000 ngày, 2000 ngày...)
  const currentDays = differenceInDays(now, start);
  const nextHundredDays = Math.ceil((currentDays + 1) / 100) * 100;
  
  // TODO: So sánh cái nào tới trước để làm mốc countdown
  // Trả về thông tin cơ bản cho hero section
  return {
    nextAnniversaryDate: nextAnniversary,
    yearCount,
    nextHundredDaysTarget: nextHundredDays
  };
}

/**
 * Format ngày tháng đẹp (ví dụ: 14 tháng 9, 2025)
 */
export function formatVietnameseDate(dateStr: string): string {
  const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
  return formatInTimeZone(date, TIMEZONE, "dd 'tháng' MM, yyyy");
}
