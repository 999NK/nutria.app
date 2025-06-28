import type { Express, RequestHandler } from "express";
import session from "express-session";
import { storage } from "./storage";

// Middleware de autenticação simplificado para desenvolvimento local
export const localAuthMiddleware: RequestHandler = async (req: any, res, next) => {
  if (process.env.LOCAL_DEV_MODE === 'true') {
    // Para desenvolvimento local, sempre permitir acesso com usuário padrão
    if (!req.user) {
      req.user = {
        claims: {
          sub: process.env.LOCAL_DEV_USER_ID || 'dev-user-123',
          email: 'dev@local.com',
          first_name: 'Dev',
          last_name: 'User'
        }
      };
      
      // Garante que o usuário existe no banco
      try {
        await storage.upsertUser({
          id: req.user.claims.sub,
          email: req.user.claims.email,
          firstName: req.user.claims.first_name,
          lastName: req.user.claims.last_name,
          profileImageUrl: null
        });
      } catch (error) {
        console.error('Erro ao criar usuário de desenvolvimento:', error);
      }
    }
    
    // Simula método isAuthenticated
    req.isAuthenticated = () => true;
    next();
  } else {
    // Para produção, redirecionar para sistema de autenticação
    res.status(401).json({ message: "Unauthorized - Authentication required" });
  }
};

// Configuração de sessão simplificada para desenvolvimento local
export function getLocalSession() {
  return session({
    secret: process.env.SESSION_SECRET || 'local-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Para desenvolvimento local
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
  });
}

// Setup de autenticação para desenvolvimento local
export async function setupLocalAuth(app: Express) {
  app.use(getLocalSession());
  
  // Adiciona middleware para simular autenticação em todas as requisições
  app.use(async (req: any, res, next) => {
    if (process.env.LOCAL_DEV_MODE === 'true') {
      if (!req.user) {
        req.user = {
          claims: {
            sub: process.env.LOCAL_DEV_USER_ID || 'dev-user-123',
            email: 'dev@local.com',
            first_name: 'Dev',
            last_name: 'User'
          }
        };
        
        // Garante que o usuário existe no banco
        try {
          await storage.upsertUser({
            id: req.user.claims.sub,
            email: req.user.claims.email,
            firstName: req.user.claims.first_name,
            lastName: req.user.claims.last_name,
            profileImageUrl: null
          });
        } catch (error) {
          console.error('Erro ao criar usuário de desenvolvimento:', error);
        }
      }
      
      // Simula método isAuthenticated
      req.isAuthenticated = () => true;
    }
    next();
  });
}