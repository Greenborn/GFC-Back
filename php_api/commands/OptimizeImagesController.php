<?php

namespace app\commands;

use yii\console\Controller;
use yii\console\ExitCode;
use app\models\Image;

/**
 * Comando para herramientas de imagen (solo diagnóstico y utilidades)
 */
class ImageToolsController extends Controller {
    
    /**
     * Verifica la configuración del sistema para procesamiento de imágenes
     */
    public function actionCheckConfig() {
        echo "=== VERIFICACIÓN DE CONFIGURACIÓN DE IMÁGENES ===\n\n";
        
        // Verificar extensiones PHP necesarias
        $extensions = ['gd', 'exif'];
        echo "Extensiones PHP:\n";
        foreach ($extensions as $ext) {
            $loaded = extension_loaded($ext);
            echo "  {$ext}: " . ($loaded ? "✅ Disponible" : "❌ No disponible") . "\n";
        }
        
        // Verificar configuración GD
        if (extension_loaded('gd')) {
            $gdInfo = gd_info();
            echo "\nCapacidades GD:\n";
            echo "  Versión: " . $gdInfo['GD Version'] . "\n";
            echo "  JPEG: " . ($gdInfo['JPEG Support'] ? "✅" : "❌") . "\n";
            echo "  PNG: " . ($gdInfo['PNG Support'] ? "✅" : "❌") . "\n";
            echo "  WebP: " . ($gdInfo['WebP Support'] ? "✅" : "❌") . "\n";
        }
        
        // Verificar configuración PHP
        echo "\nConfiguración PHP:\n";
        echo "  memory_limit: " . ini_get('memory_limit') . "\n";
        echo "  max_execution_time: " . ini_get('max_execution_time') . "\n";
        echo "  upload_max_filesize: " . ini_get('upload_max_filesize') . "\n";
        echo "  post_max_size: " . ini_get('post_max_size') . "\n";
        
        // Verificar directorios
        $basePath = \Yii::$app->params['imageBasePath'];
        echo "\nDirectorios:\n";
        echo "  Base path: {$basePath}\n";
        echo "  Existe: " . (is_dir($basePath) ? "✅" : "❌") . "\n";
        echo "  Escribible: " . (is_writable($basePath) ? "✅" : "❌") . "\n";
        
        // Verificar configuración de thumbnails
        try {
            $thumbPath = \app\models\Image::getStaticThumbnailBasePath();
            $thumbBaseDir = $basePath . '/thumbnails/';
            
            echo "  Thumbnails base: {$thumbBaseDir}\n";
            echo "  Thumbnails año actual: {$thumbPath}\n";
            echo "  Existe: " . (is_dir($thumbPath) ? "✅" : "❌ (se creará automáticamente)") . "\n";
            if (is_dir($thumbPath)) {
                echo "  Escribible: " . (is_writable($thumbPath) ? "✅" : "❌") . "\n";
            }
        } catch (\Exception $e) {
            $thumbPath = $basePath . '/thumbnails/' . date('Y') . '/';
            echo "  Thumbnails (estimado): {$thumbPath}\n";
            echo "  Error obteniendo configuración: " . $e->getMessage() . "\n";
        }
        
        // Verificar configuración de calidad
        try {
            $dummyImage = new Image();
            $config = $dummyImage->validateImageForContest(__FILE__); // Solo para obtener config
            echo "\nConfiguración de calidad cargada: ✅\n";
        } catch (\Exception $e) {
            echo "\nError cargando configuración: ❌ " . $e->getMessage() . "\n";
        }
        
        echo "\n=== RESUMEN ===\n";
        echo "El sistema está " . (extension_loaded('gd') && is_dir($basePath) && is_writable($basePath) ? 
              "✅ LISTO" : "❌ REQUIERE CONFIGURACIÓN") . " para procesar imágenes\n";
        
        return ExitCode::OK;
    }
    
    /**
     * Muestra estadísticas del sistema de imágenes
     */
    public function actionStats() {
        echo "=== ESTADÍSTICAS DEL SISTEMA DE IMÁGENES ===\n\n";
        
        $totalImages = Image::find()->count();
        echo "Total de imágenes: {$totalImages}\n";
        
        if ($totalImages > 0) {
            // Contar por dimensiones aproximadas
            $images = Image::find()->all();
            $highRes = 0;
            $mediumRes = 0;
            $lowRes = 0;
            $errors = 0;
            
            foreach ($images as $image) {
                if (empty($image->url) || !file_exists($image->url)) {
                    $errors++;
                    continue;
                }
                
                $imageInfo = getimagesize($image->url);
                if ($imageInfo !== false) {
                    $width = $imageInfo[0];
                    if ($width >= 1920) {
                        $highRes++;
                    } elseif ($width >= 1280) {
                        $mediumRes++;
                    } else {
                        $lowRes++;
                    }
                } else {
                    $errors++;
                }
            }
            
            echo "\nDistribución por resolución:\n";
            echo "  Alta resolución (≥1920px): {$highRes}\n";
            echo "  Resolución media (1280-1919px): {$mediumRes}\n";
            echo "  Resolución baja (<1280px): {$lowRes}\n";
            echo "  Archivos con error: {$errors}\n";
            
            // Calcular tamaño total
            $totalSize = 0;
            foreach ($images as $image) {
                if (!empty($image->url) && file_exists($image->url)) {
                    $totalSize += filesize($image->url);
                }
            }
            
            echo "\nUso de almacenamiento:\n";
            echo "  Tamaño total: " . $this->formatBytes($totalSize) . "\n";
            echo "  Promedio por imagen: " . $this->formatBytes($totalSize / max($totalImages - $errors, 1)) . "\n";
        }
        
        return ExitCode::OK;
    }
    
    /**
     * Formatea bytes en formato legible
     */
    private function formatBytes($size, $precision = 2) {
        if ($size == 0) return '0 B';
        
        $units = array('B', 'KB', 'MB', 'GB', 'TB');
        
        for ($i = 0; $size >= 1024 && $i < count($units) - 1; $i++) {
            $size /= 1024;
        }
        
        return round($size, $precision) . ' ' . $units[$i];
    }
}
