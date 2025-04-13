import { Server } from 'http';
import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';

/**
 * Create a WebSocket server for real-time updates
 * @param server - HTTP server instance
 * @returns WebSocket server instance
 */
export function createWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to Ecosense WebSocket Server'
    }));

    // Handle incoming messages
    ws.on('message', (message: Buffer) => {
      try {
        const parsedMessage = JSON.parse(message.toString());
        console.log('Received message:', parsedMessage);

        // Handle different message types
        switch (parsedMessage.type) {
          case 'subscribe':
            handleSubscription(ws, parsedMessage);
            break;
          default:
            console.log('Unknown message type:', parsedMessage.type);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return wss;
}

/**
 * Handle subscription requests
 * @param ws - WebSocket client
 * @param message - Subscription message
 */
function handleSubscription(ws: WebSocket, message: any) {
  const { channel } = message;
  console.log(`Client subscribed to ${channel}`);

  // Send confirmation
  ws.send(JSON.stringify({
    type: 'subscribed',
    channel
  }));
}

/**
 * Broadcast a message to all connected clients
 * @param wss - WebSocketServer
 * @param message - Message to broadcast
 */
export function broadcastMessage(wss: WebSocketServer, message: any) {
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}