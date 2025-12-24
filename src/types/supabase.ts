export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string
          nombre: string
          email: string
          fecha_creacion: string
          activo: boolean
        }
        Insert: {
          id?: string
          nombre: string
          email: string
          fecha_creacion?: string
          activo?: boolean
        }
        Update: {
          id?: string
          nombre?: string
          email?: string
          fecha_creacion?: string
          activo?: boolean
        }
      }
      servicios_asignados: {
        Row: {
          id: string
          servicio_id: number
          servicio_titulo: string
          cliente_id: string
          cliente_email: string
          cliente_nombre: string
          fecha_asignacion: string
          activo: boolean
        }
        Insert: {
          id?: string
          servicio_id: number
          servicio_titulo: string
          cliente_id: string
          cliente_email: string
          cliente_nombre: string
          fecha_asignacion?: string
          activo?: boolean
        }
        Update: {
          id?: string
          servicio_id?: number
          servicio_titulo?: string
          cliente_id?: string
          cliente_email?: string
          cliente_nombre?: string
          fecha_asignacion?: string
          activo?: boolean
        }
      }
      facturas: {
        Row: {
          id: string
          fecha_factura: string
          numero_factura: string
          cliente_email: string | null
          reporte_ids: string[] | null
          notas: string | null
          archivo_url: string | null
          archivo_nombre: string | null
          fecha_creacion: string
          fecha_modificacion: string
        }
        Insert: {
          id?: string
          fecha_factura: string
          numero_factura: string
          cliente_email?: string | null
          reporte_ids?: string[] | null
          notas?: string | null
          archivo_url?: string | null
          archivo_nombre?: string | null
          fecha_creacion?: string
          fecha_modificacion?: string
        }
        Update: {
          id?: string
          fecha_factura?: string
          numero_factura?: string
          cliente_email?: string | null
          reporte_ids?: string[] | null
          notas?: string | null
          archivo_url?: string | null
          archivo_nombre?: string | null
          fecha_creacion?: string
          fecha_modificacion?: string
        }
      }
      documentos_servicio: {
        Row: {
          id: string
          servicio_id: number
          fecha_servicio: string
          numero_reporte: string
          notas: string | null
          archivo_url: string | null
          archivo_nombre: string | null
          cliente_email: string | null
          cliente_nombre: string | null
          fecha_creacion: string
          fecha_modificacion: string
        }
        Insert: {
          id?: string
          servicio_id: number
          fecha_servicio: string
          numero_reporte: string
          notas?: string | null
          archivo_url?: string | null
          archivo_nombre?: string | null
          cliente_email?: string | null
          cliente_nombre?: string | null
          fecha_creacion?: string
          fecha_modificacion?: string
        }
        Update: {
          id?: string
          servicio_id?: number
          fecha_servicio?: string
          numero_reporte?: string
          notas?: string | null
          archivo_url?: string | null
          archivo_nombre?: string | null
          cliente_email?: string | null
          cliente_nombre?: string | null
          fecha_creacion?: string
          fecha_modificacion?: string
        }
      }
      silos: {
        Row: {
          id: string
          nombre: string
          capacidad: number
          ubicacion: string
          tipo_grano: string | null
          cliente_email: string | null
          activo: boolean
          fecha_creacion: string
        }
        Insert: {
          id?: string
          nombre: string
          capacidad: number
          ubicacion: string
          tipo_grano?: string | null
          cliente_email?: string | null
          activo?: boolean
          fecha_creacion?: string
        }
        Update: {
          id?: string
          nombre?: string
          capacidad?: number
          ubicacion?: string
          tipo_grano?: string | null
          cliente_email?: string | null
          activo?: boolean
          fecha_creacion?: string
        }
      }
      lotes: {
        Row: {
          id: string
          silo_id: string
          nombre: string
          cantidad: number
          tipo_grano: string
          fecha_ingreso: string
          fecha_creacion: string
        }
        Insert: {
          id?: string
          silo_id: string
          nombre: string
          cantidad: number
          tipo_grano: string
          fecha_ingreso: string
          fecha_creacion?: string
        }
        Update: {
          id?: string
          silo_id?: string
          nombre?: string
          cantidad?: number
          tipo_grano?: string
          fecha_ingreso?: string
          fecha_creacion?: string
        }
      }
      barcos: {
        Row: {
          id: string
          nombre: string
          capacidad: number
          estado: string
          cliente_email: string | null
          fecha_creacion: string
        }
        Insert: {
          id?: string
          nombre: string
          capacidad: number
          estado: string
          cliente_email?: string | null
          fecha_creacion?: string
        }
        Update: {
          id?: string
          nombre?: string
          capacidad?: number
          estado?: string
          cliente_email?: string | null
          fecha_creacion?: string
        }
      }
      barcos_maestros: {
        Row: {
          id: string
          nombre: string
          cliente_email: string
          activo: boolean
          fecha_creacion: string
        }
        Insert: {
          id?: string
          nombre: string
          cliente_email: string
          activo?: boolean
          fecha_creacion?: string
        }
        Update: {
          id?: string
          nombre?: string
          cliente_email?: string
          activo?: boolean
          fecha_creacion?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          nombre: string
          role: 'admin' | 'cliente'
          activo: boolean
          fecha_creacion: string
        }
        Insert: {
          id?: string
          email: string
          nombre: string
          role?: 'admin' | 'cliente'
          activo?: boolean
          fecha_creacion?: string
        }
        Update: {
          id?: string
          email?: string
          nombre?: string
          role?: 'admin' | 'cliente'
          activo?: boolean
          fecha_creacion?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'cliente'
    }
  }
}

