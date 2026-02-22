'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Client } from '@/lib/types';
import { useEffect } from 'react';

// Define custom icons
const visitedIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const notVisitedIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const defaultIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});


interface ClientMapProps {
    clients: Client[];
    selectedClient: Client | null;
    visitStatus: Map<string, 'visited' | 'not-visited'>;
}

function MapUpdater({ selectedClient }: { selectedClient: Client | null }) {
    const map = useMap();
    useEffect(() => {
        if (selectedClient?.location) {
            map.flyTo([selectedClient.location.lat, selectedClient.location.lng], 15);
        }
    }, [selectedClient, map]);

    return null;
}

const ClientMap = ({ clients, selectedClient, visitStatus }: ClientMapProps) => {
    const center: [number, number] = [-14.2350, -51.9253]; // Center of Brazil

    const clientsWithLocation = clients.filter(client => client.location);

    const getIcon = (clientId: string) => {
        const status = visitStatus.get(clientId);
        if (status === 'visited') {
            return visitedIcon;
        }
        if (status === 'not-visited') {
            return notVisitedIcon;
        }
        return defaultIcon;
    }

    return (
        <MapContainer center={center} zoom={4} scrollWheelZoom={true} style={{ height: '100%', width: '100%', borderRadius: 'var(--radius)', zIndex: 0 }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {clientsWithLocation.map(client => (
                <Marker key={client.id} position={[client.location!.lat, client.location!.lng]} icon={getIcon(client.id)}>
                    <Popup>
                       <strong>{client.name}</strong><br />
                       {client.address}, {client.city}<br />
                       {client.route}
                    </Popup>
                </Marker>
            ))}
            <MapUpdater selectedClient={selectedClient} />
        </MapContainer>
    );
};

export default ClientMap;
