import * as xlsx from 'xlsx';

export interface ParsedUser {
  Name: string;
  Email: string;
  Role: 'STUDENT' | 'TEACHER';
}

export const parseUserExcel = (buffer: Buffer): { valid: ParsedUser[]; errors: any[] } => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const rawData: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

  const valid: ParsedUser[] = [];
  const errors: any[] = [];

  rawData.forEach((row, index) => {
    const rowNum = index + 2; // +1 for 0-index, +1 for header row
    
    const name = String(row['Name'] || '').trim();
    const email = String(row['Email'] || '').trim().toLowerCase();
    const role = String(row['Role'] || '').trim().toUpperCase();

    if (!name || !email || !role) {
      errors.push({ row: rowNum, reason: 'Missing required fields (Name, Email, or Role)' });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.push({ row: rowNum, reason: 'Invalid email format' });
      return;
    }

    if (role !== 'STUDENT' && role !== 'TEACHER') {
      errors.push({ row: rowNum, reason: 'Role must be STUDENT or TEACHER' });
      return;
    }

    valid.push({ Name: name, Email: email, Role: role as 'STUDENT' | 'TEACHER' });
  });

  return { valid, errors };
};
