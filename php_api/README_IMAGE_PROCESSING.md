# Sistema de Procesamiento de Imágenes para Concursos Fotográficos

## Características Principales

### ✨ Máxima Calidad para Nuevas Imágenes
- **Calidad JPEG 100%**: Sin compresión para preservar todos los detalles
- **Algoritmo de redimensionamiento**: `imagecopyresampled` para mejor calidad que `imagecopyresized`
- **Preservación de metadatos**: Mantiene información EXIF de la cámara
- **Formato optimizado**: JPG como estándar de la industria fotográfica

### 📐 Redimensionamiento Inteligente
- **Ancho máximo**: 1920 píxeles (estándar para concursos)
- **Relación de aspecto**: Siempre preservada
- **No upscaling**: Imágenes menores a 1920px mantienen su tamaño original
- **Cálculo preciso**: Dimensiones calculadas con precisión matemática

### 🔍 Validación Estricta
- **Formatos permitidos**: JPG, PNG, GIF, WebP
- **Tamaño máximo**: 50MB por archivo
- **Dimensiones mínimas**: 800x600px (estándar para concursos)
- **Dimensiones máximas**: 8000x8000px (límite de entrada)

## ⚠️ IMPORTANTE

**Este sistema solo procesa NUEVAS imágenes que se suban al sistema.**

Las imágenes existentes NO se modifican automáticamente. Si deseas procesar imágenes existentes, debes solicitarlo específicamente y se puede crear una herramienta opcional para ello.

## Configuración

### Archivo de Configuración
Ubicación: `config/image_quality.php`

```php
'main_image' => [
    'max_width' => 1920,           // Ancho máximo para concursos
    'quality' => 100,              // Máxima calidad JPEG
    'format' => 'jpg',             // Formato estándar
    'preserve_aspect_ratio' => true
],

'thumbnails' => [
    'quality' => 85,               // Calidad para miniaturas
    'format' => 'jpg'
],

'validation' => [
    'max_file_size' => 50 * 1024 * 1024,  // 50MB
    'min_width' => 800,                     // Mínimo para concursos
    'min_height' => 600
]
```

### Configuración PHP Recomendada
```ini
memory_limit = 512M
max_execution_time = 300
upload_max_filesize = 50M
post_max_size = 50M
```

## Uso

### Procesamiento Automático
El sistema procesa automáticamente todas las imágenes subidas:

```php
// En el modelo Image, método beforeSave()
$validation = $this->validateImageForContest($tempPath);
if (!$validation['valid']) {
    throw new \yii\web\BadRequestHttpException($validation['error']);
}

$processInfo = $this->processMainImage($tempPath, $finalPath);
```

### Comando de Diagnóstico
Para verificar la configuración del sistema:

```bash
# Verificar configuración del sistema
php yii image-tools/check-config

# Ver estadísticas de imágenes existentes
php yii image-tools/stats
```

**Nota**: No hay comando automático para modificar imágenes existentes. Esto debe ser una decisión explícita del administrador.

## Flujo de Procesamiento

1. **Upload**: Usuario sube imagen en base64
2. **Validación**: Verificación de formato, tamaño y dimensiones
3. **Procesamiento**: Redimensionamiento con máxima calidad
4. **Almacenamiento**: Guardado con calidad 100%
5. **Thumbnails**: Generación de miniaturas con calidad 85%
6. **Logging**: Registro detallado del procesamiento

## Métricas de Calidad

### Log de Procesamiento
```json
{
  "file": "1722516800.jpg",
  "original": {
    "width": 3000,
    "height": 2000,
    "size": 8500000,
    "format": "jpg"
  },
  "processed": {
    "width": 1920,
    "height": 1280,
    "quality": 100,
    "file_size": 4200000
  },
  "timestamp": "2025-08-01 15:30:00"
}
```

### Ventajas para Concursos Fotográficos

1. **Calidad Máxima**: Los jueces pueden evaluar todos los detalles técnicos
2. **Consistencia**: Todas las imágenes tienen el mismo estándar de calidad
3. **Compatibilidad**: JPG es universalmente compatible
4. **Metadatos Preservados**: Información técnica de la cámara intacta
5. **Optimización Web**: Balance entre calidad y velocidad de carga

## Validaciones Implementadas

### ✅ Formato de Archivo
- Solo formatos de imagen válidos
- Verificación de magic numbers
- Extensión consistente con contenido

### ✅ Dimensiones
- Mínimo 800x600px para participación
- Máximo 8000x8000px para evitar problemas de memoria
- Cálculo preciso de relación de aspecto

### ✅ Tamaño de Archivo
- Límite de 50MB para uploads
- Verificación antes del procesamiento
- Optimización automática del resultado

### ✅ Integridad
- Verificación de que es una imagen válida
- Manejo de errores de memoria
- Cleanup automático de archivos temporales

## Mantenimiento

### Comandos de Diagnóstico

```bash
# Verificar estado del sistema
php yii image-tools/check-config

# Ver estadísticas de imágenes
php yii image-tools/stats

# Regenerar thumbnails (comando existente)
php yii generar-miniaturas
```

### Monitoreo de Logs

```bash
# Ver logs de procesamiento
tail -f runtime/logs/image_processing.log

# Buscar errores
grep "ERROR" runtime/logs/app.log
```

## Organización de Archivos

### **Estructura de Directorios**
```
/var/www/GFC-PUBLIC-ASSETS/
├── [imágenes principales procesadas]
└── thumbnails/
    ├── 2025/
    │   ├── 150_.100_123_1722516800.jpg
    │   ├── 300_.200_123_1722516801.jpg
    │   └── [otras miniaturas de 2025...]
    ├── 2024/
    │   └── [miniaturas de 2024...]
    └── 2026/
        └── [miniaturas futuras...]
```

### **Configuración de Organización**
```php
'directories' => [
    'thumbnail_subdir' => 'thumbnails/',
    'organize_by_year' => true,    // Organizar por año
    'year_format' => 'Y',          // Formato: 2025, 2024, etc.
],
```

**Ventajas de la organización por año:**
- 🗂️ Mejor organización del almacenamiento
- 🚀 Búsquedas más rápidas por período
- 📊 Análisis histórico simplificado
- 🧹 Mantenimiento y limpieza más fácil

**Nota**: Puedes cambiar `'organize_by_year' => false` si prefieres que todas las miniaturas estén en `/thumbnails/` directamente.

### Problemas Comunes

1. **Error de memoria**: Aumentar `memory_limit` en PHP
2. **Timeout**: Aumentar `max_execution_time`
3. **Permisos**: Verificar escritura en directorios de imágenes
4. **Extensión GD**: Asegurar que esté instalada y habilitada

### Verificación de Salud

```php
// Verificar extensiones necesarias
extension_loaded('gd')
extension_loaded('exif')

// Verificar soporte de formatos
$gdInfo = gd_info();
$gdInfo['JPEG Support']
$gdInfo['PNG Support']
```
