# Используем базовый образ Node.js
FROM node:18-alpine

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package*.json ./

# Устанавливаем только production зависимости
RUN npm install --production

# Копируем весь остальной проект
COPY . .

# Запускаем приложение
CMD ["npm", "start"]
