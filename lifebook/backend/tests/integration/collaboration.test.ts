/**
 * T027: Integration Test - Real-time Collaborative Editing
 * 
 * CRITICAL TDD REQUIREMENT: This test MUST FAIL initially
 */

import request from 'supertest';
import { io, Socket } from 'socket.io-client';
import { jest } from '@jest/globals';

describe('Real-time Collaborative Editing - Integration Test', () => {
  let app: any;
  let client1: Socket;
  let client2: Socket;

  beforeAll(() => {
    try {
      app = require('../../src/app');
      client1 = io('http://localhost:3001', { auth: { token: 'Bearer user1_token' }});
      client2 = io('http://localhost:3001', { auth: { token: 'Bearer user2_token' }});
    } catch (error) {
      console.error('Expected failure - collaboration not implemented yet:', error.message);
      app = null;
    }
  });

  afterAll(() => {
    if (client1) client1.close();
    if (client2) client2.close();
  });

  describe('Multi-user Document Editing', () => {
    it('should handle concurrent edits from multiple users', async () => {
      if (!app) {
        throw new Error('API not implemented - Express app missing (Expected TDD failure)');
      }

      // Create document via REST API
      const createResponse = await request(app)
        .post('/api/v1/documents')
        .send({
          title: 'Collaborative Document',
          content: { sections: [{ id: 'sec1', title: 'Shared', level: 1, order: 0, content: 'Original content' }] }
        })
        .expect(201);

      const documentId = createResponse.body.id;

      // Both users join document
      return new Promise((resolve, reject) => {
        let joinedCount = 0;
        
        const handleJoin = () => {
          joinedCount++;
          if (joinedCount === 2) {
            // User 1 makes edit
            client1.emit('text_operation', {
              documentId,
              sectionId: 'sec1',
              operation: { type: 'insert', position: 16, content: ' from user 1' }
            });

            // User 2 makes edit
            client2.emit('text_operation', {
              documentId,
              sectionId: 'sec1',
              operation: { type: 'insert', position: 8, content: 'modified ' }
            });

            resolve(true);
          }
        };

        client1.on('document_joined', handleJoin);
        client2.on('document_joined', handleJoin);
        
        client1.emit('join_document', { documentId, userId: 'user1' });
        client2.emit('join_document', { documentId, userId: 'user2' });
      });
    }, 10000);
  });
});