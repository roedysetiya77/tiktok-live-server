# Gunakan image resmi Deno
FROM denoland/deno:alpine

# Buat folder kerja
WORKDIR /app

# Salin semua file ke container
COPY . .

# Jalankan main.ts
CMD ["run", "--allow-net", "main.ts"]
