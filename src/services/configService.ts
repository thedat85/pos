// ============================================
// FN-07 + System Configuration Service
// ============================================

import { supabase } from '../lib/supabase';
import type { SystemConfig, PaymentConfig } from '../types';

interface UpdatePaymentConfigData {
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  qr_template?: string | null;
}

interface AllConfigs {
  system: SystemConfig[];
  payment: PaymentConfig | null;
}

export const configService = {
  /**
   * Get all system configuration rows.
   */
  async getSystemConfig(): Promise<SystemConfig[]> {
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .order('key', { ascending: true });

    if (error) {
      throw new Error('Failed to fetch system config: ' + error.message);
    }

    return (data ?? []) as SystemConfig[];
  },

  /**
   * Update a single system configuration entry by key.
   */
  async updateSystemConfig(
    key: string,
    value: string,
  ): Promise<SystemConfig> {
    const { data, error } = await supabase
      .from('system_config')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update system config: ' + error.message);
    }

    return data as SystemConfig;
  },

  /**
   * Get the payment configuration (expects a single row).
   */
  async getPaymentConfig(): Promise<PaymentConfig | null> {
    const { data, error } = await supabase
      .from('payment_config')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      // If no rows exist yet, return null rather than throwing
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error('Failed to fetch payment config: ' + error.message);
    }

    return data as PaymentConfig;
  },

  /**
   * Update the payment configuration row.
   * Updates the first (and expected only) row in payment_config.
   */
  async updatePaymentConfig(
    data: UpdatePaymentConfigData,
  ): Promise<PaymentConfig> {
    // Get the existing row's ID first
    const existing = await configService.getPaymentConfig();

    if (!existing) {
      throw new Error('No payment config row exists to update.');
    }

    const { data: updated, error } = await supabase
      .from('payment_config')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update payment config: ' + error.message);
    }

    return updated as PaymentConfig;
  },

  /**
   * Get both system config and payment config in a single call.
   */
  async getAllConfigs(): Promise<AllConfigs> {
    const [system, payment] = await Promise.all([
      configService.getSystemConfig(),
      configService.getPaymentConfig(),
    ]);

    return { system, payment };
  },
};
