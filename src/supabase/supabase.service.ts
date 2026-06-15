import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL') || '';
    const supabaseKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      this.configService.get<string>('SUPABASE_ANON_KEY') ||
      '';

    if (!this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')) {
      this.logger.warn(
        'SUPABASE_SERVICE_ROLE_KEY is missing from environment variables. Using ANON_KEY, which may cause Row Level Security (RLS) errors.',
      );
    }

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn(
        'SUPABASE_URL or SUPABASE_ANON_KEY is missing from environment variables.',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
}
