<?php

/**
 * Configuración de calidad de imagen para concursos fotográficos
 * Optimizado para máxima calidad y preservación de detalles
 */

return [
    // Configuración principal de imagen
    'main_image' => [
        'max_width' => 1920,           // Ancho máximo para concursos
        'quality' => 100,              // Máxima calidad JPEG (sin compresión)
        'format' => 'jpg',             // Formato estándar para fotografía
        'preserve_aspect_ratio' => true, // Mantener relación de aspecto
        'upscale' => false,            // No aumentar tamaño si es menor a max_width
    ],
    
    // Configuración de thumbnails
    'thumbnails' => [
        'quality' => 85,               // Calidad para miniaturas (balance calidad/tamaño)
        'format' => 'jpg',             // Formato consistente
        'preserve_aspect_ratio' => true,
    ],
    
    // Formatos de entrada permitidos
    'allowed_formats' => ['jpg', 'jpeg', 'jpe', 'png', 'gif', 'webp'],
    
    // Configuración de memoria para procesamiento
    'memory_settings' => [
        'memory_limit' => '512M',      // Límite de memoria para imágenes grandes
        'max_execution_time' => 300,   // 5 minutos para procesamiento
    ],
    
    // Validaciones de archivo
    'validation' => [
        'max_file_size' => 50 * 1024 * 1024,  // 50MB máximo
        'min_width' => 800,                     // Ancho mínimo para concursos
        'min_height' => 600,                    // Alto mínimo para concursos
        'max_width_original' => 8000,           // Ancho máximo de entrada
        'max_height_original' => 8000,          // Alto máximo de entrada
    ],
    
    // Metadatos a preservar
    'metadata' => [
        'preserve_exif' => true,       // Mantener datos EXIF de la cámara
        'preserve_icc' => true,        // Mantener perfil de color ICC
        'preserve_orientation' => true, // Corregir orientación automáticamente
    ],
    
    // Configuración de directorios
    'directories' => [
        'temp_prefix' => 'temp_',      // Prefijo para archivos temporales
        'thumbnail_subdir' => 'thumbnails/', // Subdirectorio para miniaturas (relativo a imageBasePath)
        'organize_by_year' => true,    // Organizar thumbnails por año (thumbnails/2025/, thumbnails/2024/, etc.)
        'year_format' => 'Y',          // Formato del año (Y para 2025, y para 25)
    ],
    
    // Configuración de logging para concursos
    'logging' => [
        'log_processing' => true,      // Registrar procesamiento de imágenes
        'log_quality_metrics' => true, // Registrar métricas de calidad
        'log_file' => 'image_processing.log',
    ]
];
