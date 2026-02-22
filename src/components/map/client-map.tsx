'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Client } from '@/lib/types';

// This is to fix the default icon issue with react-leaflet and webpack
const markerIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41]
});

interface ClientMapProps {
    clients: Client[];
}

const ClientMap = ({ clients }: ClientMapProps) => {
    const center: [number, number] = [-14.2350, -51.9253]; // Center of Brazil

    const clientsWithLocation = clients.filter(client => client.location);

    return (
        <MapContainer center={center} zoom={4} scrollWheelZoom={true} style={{ height: '100%', width: '100%', borderRadius: 'var(--radius)', zIndex: 0 }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {clientsWithLocation.map(client => (
                <Marker key={client.id} position={[client.location!.lat, client.location!.lng]} icon={markerIcon}>
                    <Popup>
                       <strong>{client.name}</strong><br />
                       {client.address}<br />
                       {client.city}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default ClientMap;
