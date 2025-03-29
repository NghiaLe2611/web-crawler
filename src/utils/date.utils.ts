// src/utils/date.utils.ts
import { parse, format } from 'date-fns'; // Assuming you're using date-fns library

export const convertToMongoDate = (dateStr: string): string => {
	const parsedDate = parse(dateStr, 'dd-MM-yyyy', new Date());
	return format(parsedDate, 'yyyy-MM-dd 00:00:00.000');
};
