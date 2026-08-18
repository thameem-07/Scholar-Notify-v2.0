# DropOut Defenders 3.0 - Static File Server (Teacher & Officer Portal)

import http.server
import socketserver
import sys
import os

PORT = 8080

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), http.server.SimpleHTTPRequestHandler) as httpd:
        print(f"==================================================")
        print(f"DropOut Defenders 3.0 Server Running on Port {PORT}")
        print(f"Live Portal: http://localhost:{PORT}")
        print(f"==================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
            sys.exit(0)
