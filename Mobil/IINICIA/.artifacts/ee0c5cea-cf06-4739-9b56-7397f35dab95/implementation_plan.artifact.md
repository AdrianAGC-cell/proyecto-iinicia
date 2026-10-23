# Supabase Integration & Institutional UI Plan

Integrate Supabase (postgrest-kt + ktor-client-android) into the native Android application and update the visual identity according to institutional specifications.

## User Review Required

> [!IMPORTANT]
> **Supabase Configuration**:
> - `SUPABASE_URL`: `"https://gtmwlgvjrsfdktyhcvck.supabase.co"`
> - `SUPABASE_KEY`: Supabase anon key configured in the Supabase client singleton.
> - Tables queried: `cursos` and `usuarios` with robust fallback to local demo data if offline.

> [!NOTE]
> **Visual Identity & Logo**:
> - Update `Color.kt` and `Theme.kt` with the official pastel blue / bone / carnita pastel palette.
> - Configure Login screen and TopAppBar to display the institutional logo (`@drawable/logo_iinicia` or vector drawable).

## Open Questions

None. All integration and design requirements are fully specified.

## Proposed Changes

### Build Configuration & Dependencies
#### [MODIFY] [build.gradle.kts (app)](file:///C:/Users/yamil/AndroidStudioProjects/IINICIA/app/build.gradle.kts)
- Add Supabase BOM / dependencies (`postgrest-kt`, `supabase-kt`) and Ktor client Android (`ktor-client-android`).

### Data & Supabase Client (`com.example.iinicia.data`)
#### [NEW] [SupabaseClient.kt](file:///C:/Users/yamil/AndroidStudioProjects/IINICIA/app/src/main/java/com/example/iinicia/data/SupabaseClient.kt)
- Singleton Supabase client initialization (`createSupabaseClient`).
#### [MODIFY] [IiniciaRepository.kt](file:///C:/Users/yamil/AndroidStudioProjects/IINICIA/app/src/main/java/com/example/iinicia/data/IiniciaRepository.kt)
- Update data fetching to query Supabase tables `cursos` and `usuarios` using Postgrest with seamless offline/timeout fallback to local demo data.

### Theme & UI Assets (`com.example.iinicia.ui`)
#### [MODIFY] [Color.kt](file:///C:/Users/yamil/AndroidStudioProjects/IINICIA/app/src/main/java/com/example/iinicia/ui/theme/Color.kt)
- Define official pastel blue, bone, and carnita pastel color constants.
#### [MODIFY] [Theme.kt](file:///C:/Users/yamil/AndroidStudioProjects/IINICIA/app/src/main/java/com/example/iinicia/ui/theme/Theme.kt)
- Update theme to apply the official palette.
#### [MODIFY] [InstitutionalHeader.kt](file:///C:/Users/yamil/AndroidStudioProjects/IINICIA/app/src/main/java/com/example/iinicia/ui/components/InstitutionalHeader.kt) & [LoginScreen.kt](file:///C:/Users/yamil/AndroidStudioProjects/IINICIA/app/src/main/java/com/example/iinicia/ui/screens/LoginScreen.kt)
- Integrate `@drawable/logo_iinicia` (or vector fallback) into TopAppBar and Login screen.

## Verification Plan

### Automated Tests
- Build verification via `gradle_build("app:assembleDebug")`.

### Manual Verification
- Verify Supabase connectivity and offline fallback.
- Verify UI rendering of institutional logo and pastel bone color palette.
