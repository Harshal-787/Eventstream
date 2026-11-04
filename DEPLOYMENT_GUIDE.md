# EventStream — Live Server Deployment Guide

To deploy the EventStream application successfully on a live server, you must ensure that your reverse proxy (e.g., Nginx) is correctly configured to serve the built static React files for the frontend, while proxying API requests and WebSockets to the Go backend.

## Nginx Server Block Configuration

Copy and paste the following block into your Nginx configuration (e.g., `/etc/nginx/sites-available/default` or similar).

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name www.grcno.com grcno.com;

    # ----------------------------------------------------
    # 1. API & WebSocket Proxy (Go Backend)
    # ----------------------------------------------------
    # All requests starting with /eventstream/api/ go to the Go server running on port 8080.
    location /eventstream/api/ {
        proxy_pass http://localhost:8080/api/;
        
        # Essential headers for proxying
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket / SSE support (Required for EventStream)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Prevent Nginx from buffering Server-Sent Events (SSE)
        proxy_buffering off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # ----------------------------------------------------
    # 2. Frontend React Application
    # ----------------------------------------------------
    # Serve the static files for the React frontend hosted at /eventstream/
    location /eventstream/ {
        # The physical path on your server where the `Frontend/dist` folder is located
        alias /path/to/your/eventstream/Frontend/dist/;
        
        # SPA Fallback: If a file isn't found, fallback to index.html for React Router
        try_files $uri $uri/ /eventstream/index.html;
    }

    # ----------------------------------------------------
    # 3. Security & Caching (Optional but recommended)
    # ----------------------------------------------------
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

### Steps to Apply:
1. Replace `/path/to/your/eventstream/Frontend/dist/` with the actual absolute path to your built frontend files on the server (e.g., `/var/www/html/eventstream/dist/`).
2. Run `sudo nginx -t` to test the configuration for syntax errors.
3. Run `sudo systemctl restart nginx` to apply the changes.

## Troubleshooting
- **White Screen / 404 on Refresh**: Ensure the `try_files` directive points exactly to `/eventstream/index.html`.
- **Live Data Not Updating**: Ensure `proxy_buffering off;` is present inside the `/api/` block. Our Go backend now also natively sends the `X-Accel-Buffering: no` header.
