from fastapi import WebSocket
import logging

class WebSocketManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        if client_id in self.active_connections:
            logging.warn("Client {client_id} already connected when requesting to connect")
        await websocket.accept()
        logging.info(f"Accepted connection with id {client_id}")
        self.active_connections[client_id] = websocket
    
    def disconnect(self, client_id: str):
        if client_id not in self.active_connections:
            logging.warn("Client {client_id} not in active_connections when requesting to disconnect")
        else:
            del self.active_connections[client_id]
    
    async def broadcast(self, content: dict):
        for connection in self.active_connections.values():
            await connection.send_json(content)
    
    async def send_json(self, client_id: str, content: dict):
        await self.active_connections[client_id].send_json(content)