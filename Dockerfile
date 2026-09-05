FROM node:20-alpine
WORKDIR /app

# نسخ ملفات تعريف الحزم والاعتماديات
COPY package*.json ./

# خطوة الحصانة الحيوية: نسخ مجلد التجاوز المحلي لتفادي كسر تثبيت npm ci
COPY node-domexception-mock ./node-domexception-mock

# تثبيت الاعتماديات التشغيلية والإنتاجية فقط بأمان وسرعة
RUN npm ci --only=production

# نسخ مجلد التجميع النهائي لخدمات واجهة المستخدم والخادم الموحد
COPY dist ./dist

# تفعيل البيئة الحية والمنفذ التشغيلي الحاكم لـ Cloud Run
ENV NODE_ENV=production
EXPOSE 8080

CMD ["sh", "-c", "node dist/server.cjs"]
