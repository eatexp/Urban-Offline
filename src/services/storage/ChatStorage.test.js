import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as ChatStorage from './ChatStorage';
import { db } from '../db';

// Mock the db abstraction
vi.mock('../db', () => ({
    db: {
        get: vi.fn(),
        getAll: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        batchDelete: vi.fn(),
        getAllFromIndex: vi.fn(),
    }
}));

describe('ChatStorage (Mission Logs)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getSessions returns sorted sessions', async () => {
        const mockSessions = [
            { id: '1', updatedAt: '2023-01-01T10:00:00Z' },
            { id: '2', updatedAt: '2023-01-02T10:00:00Z' } // Newer
        ];
        db.getAll.mockResolvedValue(mockSessions);

        const result = await ChatStorage.getSessions();

        expect(db.getAll).toHaveBeenCalledWith('sessions');
        expect(result[0].id).toBe('2'); // Sort order check
    });

    it('saveSession adds timestamp', async () => {
        const session = { id: 'test', title: 'Mission 1' };
        await ChatStorage.saveSession(session);

        expect(db.put).toHaveBeenCalledWith('sessions', expect.objectContaining({
            id: 'test',
            title: 'Mission 1',
            updatedAt: expect.any(String)
        }));
    });

    it('getMessages uses index', async () => {
        const mockMessages = [
            { id: 'm1', sessionId: 's1', content: 'Hello', timestamp: '2023-01-01' }
        ];
        db.getAllFromIndex.mockResolvedValue(mockMessages);

        const result = await ChatStorage.getMessages('s1');

        expect(db.getAllFromIndex).toHaveBeenCalledWith('messages', 'sessionId', 's1');
        expect(result[0].timestamp).toBeInstanceOf(Date); // Rehydration check
    });

    it('saveMessage serializes correctly', async () => {
        const date = new Date();
        const msg = {
            id: 'm1',
            role: 'user',
            content: 'help',
            timestamp: date
        };

        await ChatStorage.saveMessage('s1', msg);

        expect(db.put).toHaveBeenCalledWith('messages', expect.objectContaining({
            id: 'm1',
            sessionId: 's1',
            timestamp: date.toISOString() // Verify serialization
        }));
    });

    it('deleteSession removes session and messages', async () => {
        db.getAllFromIndex.mockResolvedValue([{ id: 'm1' }, { id: 'm2' }]);

        await ChatStorage.deleteSession('s1');

        expect(db.delete).toHaveBeenCalledWith('sessions', 's1');
        expect(db.batchDelete).toHaveBeenCalledWith('messages', ['m1', 'm2']);
    });
});
