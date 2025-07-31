# Next Api Fetch

A lightweight and flexible TypeScript API wrapper around the native `fetch` function, with support for:

- ✅ Query parameters
- ✅ JSON request bodies
- ✅ Custom headers and caching
- ✅ Error handling with detailed messages
- ✅ Next.js `fetch` options like `revalidate`, `tags`, and `cache`

---

## 📦 Installation

```bash
npm install @andreyvalenko/next-fetch
```

## Usage:

1. Create an API instance

```bash
import Api from './api';

const api =  Api.create({
  baseUrl: 'https://api.example.com',
});

```

2. GET request

```bash
type User = { id: number; name: string };

const users = await api.get<User[]>('/users', {
  params: { role: 'admin' },
  next: { revalidate: 60 }, // Next.js specific option
});

```

3. POST request

```bash
type Response = { success: boolean };
type Payload = { email: string; password: string };

const result = await api.post<Response, Payload>('/auth/login', {
  body: { email: 'test@example.com', password: '123456' },
});


```

## Let me know if you'd like to add:

- 🧪 tests section
- 📚 usage in Next.js app
- 💡 tips for extending with `PUT`/`DELETE` methods
