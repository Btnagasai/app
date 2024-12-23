import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { userRouter } from './routes/userRouter'
import { productRouter } from './routes/productRouter'
import { orderRouter } from './routes/orderRouter'
import cors from '@elysiajs/cors'
import { logger } from '@bogeychan/elysia-logger'
import authRouter from './routes/authRouter'



const app = new Elysia()
    app.use(cors());
    app.use(logger())
    app.use(swagger({
        path:"/swagger"
    }))
    
    .get('/', () => {
        return { message: 'Hello, World!' }
    })
    
    .use(userRouter)
    .use(authRouter)
    .use(productRouter)
    .use(orderRouter)
    .listen(3000)