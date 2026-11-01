import type { Tenant } from '../types';
import { supabase } from '../integrations/supabase/client';

interface TenantRow {
  id: string;
  nome: string;
  tipo: Tenant['tipo'];
  created_at: string;
}

export const tenantService = {
  listTenants: async (): Promise<Tenant[]> => {
    const { data, error } = await supabase.from('tenants').select('*');
    if (error) throw new Error(`Não foi possível carregar os clientes: ${error.message}`);
    return data as TenantRow[];
  },

  getTenant: async (id: string): Promise<Tenant | null> => {
    const { data, error } = await supabase.from('tenants').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Não foi possível carregar o cliente: ${error.message}`);
    return data as TenantRow | null;
  },
};

export default tenantService;
