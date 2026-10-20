
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "cihazlar": {
                  Row: {
                    "abonelik": Json | null,"expo_push_token": string,"id": string,"kullanici_id": string,"platform": string,"son_gorulme": string
                  }
                  ComputedFields: never
                  Insert: {
                    "abonelik"?: Json | null,"expo_push_token": string,"id"?: string,"kullanici_id"?: string,"platform": string,"son_gorulme"?: string
                  }
                  Update: {
                    "abonelik"?: Json | null,"expo_push_token"?: string,"id"?: string,"kullanici_id"?: string,"platform"?: string,"son_gorulme"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "cihazlar_kullanici_id_fkey"
      columns: ["kullanici_id"]
isOneToOne: false
      referencedRelation: "kullanici"
      referencedColumns: ["id"]
    }
                  ]
                },"davetler": {
                  Row: {
                    "gonderen_id": string,"grup_id": string,"id": string,"iptal_tarihi": string | null,"kullanan_id": string | null,"kullanilma": string | null,"maks_kullanim": number,"olusturma": string,"son_gecerlilik": string,"telefon": string | null,"tip": string,"token": string
                  }
                  ComputedFields: never
                  Insert: {
                    "gonderen_id": string,"grup_id": string,"id"?: string,"iptal_tarihi"?: string | null,"kullanan_id"?: string | null,"kullanilma"?: string | null,"maks_kullanim"?: number,"olusturma"?: string,"son_gecerlilik"?: string,"telefon"?: string | null,"tip"?: string,"token": string
                  }
                  Update: {
                    "gonderen_id"?: string,"grup_id"?: string,"id"?: string,"iptal_tarihi"?: string | null,"kullanan_id"?: string | null,"kullanilma"?: string | null,"maks_kullanim"?: number,"olusturma"?: string,"son_gecerlilik"?: string,"telefon"?: string | null,"tip"?: string,"token"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "davetler_gonderen_id_fkey"
      columns: ["gonderen_id"]
isOneToOne: false
      referencedRelation: "kullanici"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "davetler_grup_id_fkey"
      columns: ["grup_id"]
isOneToOne: false
      referencedRelation: "grup"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "davetler_kullanan_id_fkey"
      columns: ["kullanan_id"]
isOneToOne: false
      referencedRelation: "kullanici"
      referencedColumns: ["id"]
    }
                  ]
                },"duraklatmalar": {
                  Row: {
                    "baslangic": string,"bitis": string | null,"id": string,"kullanici_program_id": string,"neden": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "baslangic": string,"bitis"?: string | null,"id"?: string,"kullanici_program_id": string,"neden"?: string | null
                  }
                  Update: {
                    "baslangic"?: string,"bitis"?: string | null,"id"?: string,"kullanici_program_id"?: string,"neden"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "duraklatmalar_kullanici_program_id_fkey"
      columns: ["kullanici_program_id"]
isOneToOne: false
      referencedRelation: "kullanici_program"
      referencedColumns: ["id"]
    }
                  ]
                },"grup": {
                  Row: {
                    "ad": string,"aktif": boolean,"baslangic_tarihi": string,"davet_kodu": string,"ders_gunu": string | null,"ders_saati": string | null,"id": string,"konum": string | null,"kurucu_id": string,"olusturma_tarihi": string,"program_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ad": string,"aktif"?: boolean,"baslangic_tarihi": string,"davet_kodu": string,"ders_gunu"?: string | null,"ders_saati"?: string | null,"id"?: string,"konum"?: string | null,"kurucu_id": string,"olusturma_tarihi"?: string,"program_id": string
                  }
                  Update: {
                    "ad"?: string,"aktif"?: boolean,"baslangic_tarihi"?: string,"davet_kodu"?: string,"ders_gunu"?: string | null,"ders_saati"?: string | null,"id"?: string,"konum"?: string | null,"kurucu_id"?: string,"olusturma_tarihi"?: string,"program_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "grup_kurucu_id_fkey"
      columns: ["kurucu_id"]
isOneToOne: false
      referencedRelation: "kullanici"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "grup_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "program"
      referencedColumns: ["id"]
    }
                  ]
                },"hatirlatmalar": {
                  Row: {
                    "alan_id": string,"durum": string,"gonderen_id": string,"grup_id": string,"gun_no": number,"id": string,"kanal": string,"tarih": string,"zaman": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alan_id": string,"durum"?: string,"gonderen_id": string,"grup_id": string,"gun_no": number,"id"?: string,"kanal": string,"tarih": string,"zaman"?: string
                  }
                  Update: {
                    "alan_id"?: string,"durum"?: string,"gonderen_id"?: string,"grup_id"?: string,"gun_no"?: number,"id"?: string,"kanal"?: string,"tarih"?: string,"zaman"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "hatirlatmalar_alan_id_fkey"
      columns: ["alan_id"]
isOneToOne: false
      referencedRelation: "kullanici"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "hatirlatmalar_gonderen_id_fkey"
      columns: ["gonderen_id"]
isOneToOne: false
      referencedRelation: "kullanici"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "hatirlatmalar_grup_id_fkey"
      columns: ["grup_id"]
isOneToOne: false
      referencedRelation: "grup"
      referencedColumns: ["id"]
    }
                  ]
                },"kitaplar": {
                  Row: {
                    "ad": string,"id": string,"sayfa_sayisi": number
                  }
                  ComputedFields: never
                  Insert: {
                    "ad": string,"id"?: string,"sayfa_sayisi": number
                  }
                  Update: {
                    "ad"?: string,"id"?: string,"sayfa_sayisi"?: number
                  }
                  Relationships: [
                    
                  ]
                },"kullanici": {
                  Row: {
                    "ad": string,"dil": string,"eposta": string | null,"hatirlatma_acik": boolean,"hatirlatma_saatleri": (string)[],"id": string,"kayit_tarihi": string,"saat_dilimi": string,"silinme_tarihi": string | null,"soyad": string | null,"telefon": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "ad": string,"dil"?: string,"eposta"?: string | null,"hatirlatma_acik"?: boolean,"hatirlatma_saatleri"?: (string)[],"id"?: string,"kayit_tarihi"?: string,"saat_dilimi"?: string,"silinme_tarihi"?: string | null,"soyad"?: string | null,"telefon"?: string | null
                  }
                  Update: {
                    "ad"?: string,"dil"?: string,"eposta"?: string | null,"hatirlatma_acik"?: boolean,"hatirlatma_saatleri"?: (string)[],"id"?: string,"kayit_tarihi"?: string,"saat_dilimi"?: string,"silinme_tarihi"?: string | null,"soyad"?: string | null,"telefon"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"kullanici_program": {
                  Row: {
                    "baslangic_tarihi": string,"dahil_olma_tarihi": string,"davet_id": string | null,"durum": string,"durum_tarihi": string | null,"grup_id": string | null,"hatirlatma_kabul": boolean,"id": string,"kullanici_id": string,"program_id": string,"rol": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "baslangic_tarihi": string,"dahil_olma_tarihi"?: string,"davet_id"?: string | null,"durum"?: string,"durum_tarihi"?: string | null,"grup_id"?: string | null,"hatirlatma_kabul"?: boolean,"id"?: string,"kullanici_id": string,"program_id": string,"rol"?: string | null
                  }
                  Update: {
                    "baslangic_tarihi"?: string,"dahil_olma_tarihi"?: string,"davet_id"?: string | null,"durum"?: string,"durum_tarihi"?: string | null,"grup_id"?: string | null,"hatirlatma_kabul"?: boolean,"id"?: string,"kullanici_id"?: string,"program_id"?: string,"rol"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "kullanici_program_davet_id_fkey"
      columns: ["davet_id"]
isOneToOne: false
      referencedRelation: "davetler"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "kullanici_program_grup_id_fkey"
      columns: ["grup_id"]
isOneToOne: false
      referencedRelation: "grup"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "kullanici_program_kullanici_id_fkey"
      columns: ["kullanici_id"]
isOneToOne: false
      referencedRelation: "kullanici"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "kullanici_program_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "program"
      referencedColumns: ["id"]
    }
                  ]
                },"notlar": {
                  Row: {
                    "grupla_paylas": string | null,"id": string,"kitap_id": string,"kullanici_id": string,"metin": string,"olusturma": string,"sayfa": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "grupla_paylas"?: string | null,"id"?: string,"kitap_id": string,"kullanici_id"?: string,"metin": string,"olusturma"?: string,"sayfa"?: number | null
                  }
                  Update: {
                    "grupla_paylas"?: string | null,"id"?: string,"kitap_id"?: string,"kullanici_id"?: string,"metin"?: string,"olusturma"?: string,"sayfa"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "notlar_grupla_paylas_fkey"
      columns: ["grupla_paylas"]
isOneToOne: false
      referencedRelation: "grup"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notlar_kitap_id_fkey"
      columns: ["kitap_id"]
isOneToOne: false
      referencedRelation: "kitaplar"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notlar_kullanici_id_fkey"
      columns: ["kullanici_id"]
isOneToOne: false
      referencedRelation: "kullanici"
      referencedColumns: ["id"]
    }
                  ]
                },"okuma_kayitlari": {
                  Row: {
                    "gun_no": number,"id": string,"kaynak": string,"kullanici_program_id": string,"okunan_sayfa": number | null,"okunma_tarihi": string,"olusturma": string,"telafi_mi": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "gun_no": number,"id"?: string,"kaynak"?: string,"kullanici_program_id": string,"okunan_sayfa"?: number | null,"okunma_tarihi": string,"olusturma"?: string,"telafi_mi"?: boolean
                  }
                  Update: {
                    "gun_no"?: number,"id"?: string,"kaynak"?: string,"kullanici_program_id"?: string,"okunan_sayfa"?: number | null,"okunma_tarihi"?: string,"olusturma"?: string,"telafi_mi"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "okuma_kayitlari_kullanici_program_id_fkey"
      columns: ["kullanici_program_id"]
isOneToOne: false
      referencedRelation: "kullanici_program"
      referencedColumns: ["id"]
    }
                  ]
                },"program": {
                  Row: {
                    "ad": string,"duzen_modu": string,"gorunurluk": string,"gunluk_sayfa": number,"id": string,"okuma_gunleri": string | null,"olusturan_id": string | null,"onerilen_baslangic": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "ad": string,"duzen_modu"?: string,"gorunurluk"?: string,"gunluk_sayfa": number,"id"?: string,"okuma_gunleri"?: string | null,"olusturan_id"?: string | null,"onerilen_baslangic"?: string | null
                  }
                  Update: {
                    "ad"?: string,"duzen_modu"?: string,"gorunurluk"?: string,"gunluk_sayfa"?: number,"id"?: string,"okuma_gunleri"?: string | null,"olusturan_id"?: string | null,"onerilen_baslangic"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "program_olusturan_id_fkey"
      columns: ["olusturan_id"]
isOneToOne: false
      referencedRelation: "kullanici"
      referencedColumns: ["id"]
    }
                  ]
                },"program_kitaplari": {
                  Row: {
                    "baslangic_sayfasi": number | null,"bitis_sayfasi": number | null,"id": string,"kitap_id": string,"program_id": string,"sira": number
                  }
                  ComputedFields: never
                  Insert: {
                    "baslangic_sayfasi"?: number | null,"bitis_sayfasi"?: number | null,"id"?: string,"kitap_id": string,"program_id": string,"sira": number
                  }
                  Update: {
                    "baslangic_sayfasi"?: number | null,"bitis_sayfasi"?: number | null,"id"?: string,"kitap_id"?: string,"program_id"?: string,"sira"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "program_kitaplari_kitap_id_fkey"
      columns: ["kitap_id"]
isOneToOne: false
      referencedRelation: "kitaplar"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "program_kitaplari_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "program"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "bitis_tarihi":
{ Args: { "kp_id": string }; Returns: string
                           },
"bu_hafta":
{ Args: { "kp_id": string }; Returns: {
              "durum": string,"gun_no": number,"tarih": string
            }[]
                           },
"bugunku_gun_no":
{ Args: { "kp_id": string,"tarih"?: string }; Returns: number
                           },
"davet_kabul":
{ Args: { "p_token": string }; Returns: Json
                           },
"davet_olustur":
{ Args: { "p_grup_id": string,"p_maks_kullanim"?: number,"p_telefon"?: string,"p_tip": string }; Returns: {
              "gonderen_id": string,
"grup_id": string,
"id": string,
"iptal_tarihi": string | null,
"kullanan_id": string | null,
"kullanilma": string | null,
"maks_kullanim": number,
"olusturma": string,
"son_gecerlilik": string,
"telefon": string | null,
"tip": string,
"token": string
            }
                          SetofOptions: {
        from: "*"
        to: "davetler"
        isOneToOne: true
        isSetofReturn: false
      } },
"davet_onizleme":
{ Args: { "p_token": string }; Returns: {
              "baslangic_tarihi": string,"davet_eden": string,"ders_gunu": string,"ders_saati": string,"gecerli": boolean,"grup_ad": string,"konum": string,"program_ad": string,"uye_sayisi": number
            }[]
                           },
"devam_et":
{ Args: { "kp_id": string }; Returns: undefined
                           },
"duraklat":
{ Args: { "kp_id": string,"p_neden"?: string }; Returns: undefined
                           },
"edge_cagir":
{ Args: { "fonksiyon": string }; Returns: number
                           },
"geride_gunler":
{ Args: { "kp_id": string }; Returns: {
              "durum": string,"gun_no": number,"tarih": string
            }[]
                           },
"grup_durumu":
{ Args: { "p_grup_id": string }; Returns: {
              "ad": string,"bugun_hatirlatildi": boolean,"bugun_okudu": boolean,"bugunku_gun": number,"geride_gun": number,"hatirlatma_kabul": boolean,"kullanici_id": string,"kullanici_program_id": string,"rol": string,"seri": number,"soyad": string,"tamamlanan": number
            }[]
                           },
"grup_kur":
{ Args: { "p_ad": string,"p_baslangic": string,"p_program_id": string }; Returns: string
                           },
"gun_araligi":
{ Args: { "p_gun_no": number,"p_program_id": string }; Returns: {
              "bas_sayfa": number,"kitap_ad": string,"kitap_id": string,"son_sayfa": number
            }[]
                           },
"gun_serisi":
{ Args: { "kp_id": string,"son": string }; Returns: {
              "duraklatildi": boolean,"gun_no": number,"tarih": string
            }[]
                           },
"gunluk_hatirlatma_adaylari":
{ Args: { "p_simdi"?: string }; Returns: {
              "gun_no": number,"kullanici_id": string,"kullanici_program_id": string
            }[]
                           },
"hatirlatma_gonder":
{ Args: { "p_alan_id": string,"p_grup_id": string,"p_kanal": string }; Returns: Json
                           },
"hesaplari_anonimlestir":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"ilerleme":
{ Args: { "kp_id": string }; Returns: Record<string, unknown>
                           },
"is_grup_uyesi":
{ Args: { "p_grup_id": string }; Returns: boolean
                           },
"is_grup_yoneticisi":
{ Args: { "p_grup_id": string }; Returns: boolean
                           },
"kp_gorunur":
{ Args: { "kp_id": string }; Returns: boolean
                           },
"kp_sahibi_mi":
{ Args: { "kp_id": string }; Returns: boolean
                           },
"kp_yerel_bugun":
{ Args: { "kp_id": string }; Returns: string
                           },
"kullanici_bugun":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"nci_okuma_gunu":
{ Args: { "p_baslangic": string,"p_gunler": string,"p_n": number }; Returns: string
                           },
"program_bitis":
{ Args: { "p_baslangic": string,"p_program_id": string }; Returns: string
                           },
"program_gorunur":
{ Args: { "p_program_id": string }; Returns: boolean
                           },
"program_gunleri":
{ Args: { "p_program_id": string }; Returns: string
                           },
"program_onizleme":
{ Args: { "p_baslangic"?: string,"p_gunler": string,"p_gunluk": number,"p_kitaplar": Json }; Returns: Record<string, unknown>
                           },
"program_toplam":
{ Args: { "p_program_id": string }; Returns: Record<string, unknown>
                           },
"programa_basla":
{ Args: { "p_baslangic"?: string,"p_program_id": string }; Returns: string
                           },
"sonraki_ders":
{ Args: { "p_grup_id": string }; Returns: string
                           },
"takvim":
{ Args: { "bas": string,"kp_id": string,"son": string }; Returns: {
              "durum": string,"gun_no": number,"tarih": string
            }[]
                           },
"yerel_bugun":
{ Args: { "saat_dilimi": string }; Returns: string
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
