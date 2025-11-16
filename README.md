# DỪNG TẤT CẢ
docker-compose down

# XÓA VOLUME CŨ (QUAN TRỌNG NHẤT!)
docker volume rm restaurant-microservices_postgres_data

# HOẶC XÓA TẤT CẢ VOLUME (nếu không nhớ tên)
docker volume prune -f

# REBUILD + START LẠI
docker-compose up --build -d

docker-compose down -v
docker system prune -af
docker volume prune -f

docker-compose down 
docker-compose up --build -d