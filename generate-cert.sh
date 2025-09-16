#!/bin/bash

IP=$(ipconfig getifaddr en0)

if [ -z "$IP" ]; then
  echo "Could not determine IP address"
  exit 1
fi

echo "Generating certificate for IP: $IP"

# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout /tmp/fret-cert-key.pem -out /tmp/fret-cert.pem -days 1 -nodes -subj "/CN=$IP"

echo "Certificate generated"