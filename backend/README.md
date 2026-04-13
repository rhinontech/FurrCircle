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
docker exec pawshub-backend npm run bootstrap-admin -- --email alex@rhinonlabs.com --name Alex
```

Optional flags:

- `--password <value>` to set an explicit password
- `--email <value>` to target a different admin account
- `--name <value>` to set the display name

If `--password` is omitted, the script generates a temporary password and prints it once.
