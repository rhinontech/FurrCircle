# FurrCircle Backend

## Running with Docker Compose

To start the backend and the PostgreSQL database:

1. **Ensure Docker is running** on your machine.
2. **Stop any local processes** running on the same ports (e.g., if you are running `npm run dev` locally, stop it to avoid port conflicts with 5001/5433).
3. **Run the following command** in the `backend` directory:

```bash
docker-compose up -d --build
```

- `-d`: Runs containers in the background (detached).
- `--build`: Forces a rebuild of the backend image.

### Useful Commands

- **View logs**: `docker-compose logs -f backend`
- **Stop services**: `docker-compose down`
- **Restart services**: `docker-compose restart`

## Admin Bootstrap

Public registration no longer allows creating `admin` users. Bootstrap or rotate an admin account with:

```bash
docker exec furrcircle-backend npm run bootstrap-admin -- --email alex@rhinonlabs.com --name Alex
```

Optional flags:

- `--password <value>` to set an explicit password
- `--email <value>` to target a different admin account
- `--name <value>` to set the display name

If `--password` is omitted, the script generates a temporary password and prints it once.

## Google Places (POC)

This backend includes a small proxy API for Google Places (New) to support "search by text" and "place details" without exposing the API key to the mobile app.

### Environment

Set one of:

- `GOOGLE_PLACES_API_KEY` (preferred)
- `GOOGLE_MAPS_API_KEY`
- `GOOGLE_MAPS_DEMO_KEY` (fallback already supported)

### Endpoints

All endpoints are currently protected via JWT (`Authorization: Bearer <token>`).

- `GET /api/places/text-search?q=...`
- `POST /api/places/text-search` with JSON body:

```json
{
  "query": "veterinary care near bandra",
  "pageSize": 10,
  "includedType": "veterinary_care",
  "lat": 19.0607,
  "lng": 72.8362,
  "radiusMeters": 5000
}
```

- `GET /api/places/:placeId`
