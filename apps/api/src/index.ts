import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import blogRoute from './routes/blog'

const app = new Hono()

app.use('/*', cors())

app.route('/api/blog', blogRoute)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

const port = Number(process.env.PORT) || 3001

serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
