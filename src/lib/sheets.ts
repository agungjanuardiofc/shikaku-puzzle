import { getAccessToken } from './auth';

const SHEET_ID_KEY = 'shikaku_speedrun_sheet_id';

export async function getOrCreateSpreadsheet(): Promise<string> {
    const existingId = localStorage.getItem(SHEET_ID_KEY);
    if (existingId) return existingId;

    const token = await getAccessToken();
    if (!token) throw new Error("No access token");

    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            properties: {
                title: 'Shikaku Speedrun Top 10'
            },
            sheets: [
                {
                    properties: {
                        title: 'Leaderboard'
                    }
                }
            ]
        })
    });

    if (!res.ok) throw new Error("Failed to create spreadsheet");
    const data = await res.json();
    
    const spreadsheetId = data.spreadsheetId;
    
    // Add headers
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Leaderboard!A1:B1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            values: [["Name", "Time (ms)"]]
        })
    });

    localStorage.setItem(SHEET_ID_KEY, spreadsheetId);
    return spreadsheetId;
}

export async function addScoreToLeaderboard(name: string, timeMs: number): Promise<void> {
    const spreadsheetId = await getOrCreateSpreadsheet();
    const token = await getAccessToken();
    if (!token) throw new Error("No access token");

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Leaderboard!A:B:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            values: [[name, timeMs]]
        })
    });

    if (!res.ok) throw new Error("Failed to append score");
}

export async function getTop10Scores(): Promise<{name: string, timeMs: number}[]> {
    try {
        const spreadsheetId = await getOrCreateSpreadsheet();
        const token = await getAccessToken();
        if (!token) return [];

        const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Leaderboard!A2:B?majorDimension=ROWS`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) return [];

        const data = await res.json();
        const rows = data.values || [];
        
        return rows
            .map((row: any[]) => ({
                name: row[0] || 'Unknown',
                timeMs: parseInt(row[1] || '0', 10)
            }))
            .filter((item) => !isNaN(item.timeMs) && item.timeMs > 0)
            .sort((a, b) => a.timeMs - b.timeMs)
            .slice(0, 10);
    } catch (e) {
        console.error("Failed to fetch leaderboard", e);
        return [];
    }
}
