<?php

namespace app\models;

use Yii;
use yii\web\UploadedFile;
use app\models\Thumbnail;
use app\models\ThumbnailType;
use app\models\ContestResult;
// use yii\helpers\Url;

/**
 * This is the model class for table "image".
 *
 * @property int $id
 * @property string $code
 * @property string $title
 * @property int $profile_id
 *
 * @property ContestResult[] $contestResults
 */
class Image extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'image';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['code', 'title', 'profile_id'], 'required'],
            [['profile_id'], 'integer'],
            [['title', 'url', 'code'], 'string'],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'code' => 'Code',
            'title' => 'Title',
            'profile_id' => 'Profile ID',
            'url' => 'Url'
            // 'image_file' => 'Image File'
        ];
    }

    public function beforeDelete() {
        if (!empty($this->url) && file_exists($this->url)) {
            unlink($this->url);
            // echo 'se elimnó la img';
        }

        //se buscan las miniaturas y se eliminan
        $thumbs = $this->getThumbnail()->all();
        for ($c=0; $c < count($thumbs); $c++ ){
            //var_dump($thumbs[$c]);
            if (!empty($thumbs[$c]->url) && file_exists($thumbs[$c]->url)) {
                unlink($thumbs[$c]->url);
            }

            $thumbs[$c]->delete();
        }

        return true;
    }

    private function base64_to_file($base64_string, $output_file) {
        // open the output file for writing
        $ifp = fopen( $output_file, 'wb' ); 
        $data = explode( ',', $base64_string );
    
        // we could add validation here with ensuring count( $data ) > 1
        fwrite( $ifp, base64_decode( $data[ 1 ] ) );
    
        // clean up the file resource
        fclose( $ifp ); 
    
        return $output_file; 
    }

    public $category = NULL;

    public function regenerateThumbnail( $id ){
        //se buscan las miniaturas y se eliminan
        $thumbs = $this->getThumbnail()->all();
        for ($c=0; $c < count($thumbs); $c++ ){
            var_dump($thumbs[$c]);
            if (!empty($thumbs[$c]->url) && file_exists($thumbs[$c]->url)) {
                unlink($thumbs[$c]->url);
            }

            $thumbs[$c]->delete();
        }

        echo "Regenerar thumbnail ".$this->id." \n";
        $img_name = "https://gfc.prod-api.greenborn.com.ar/".$this->url;
        $this->generateThumbnails('', $img_name, 'images/thumbnails/');
    }

    public function beforeSave($insert) {
        $params = Yii::$app->getRequest()->getBodyParams();
        
        if (isset($params['photo_base64'])) {
            $date   = new \DateTime();

            $extension = 'jpg';
            //Este nombre es temporal, luego la proxima peticion que asigna la imagen al concurso, sera la que se encargara de catalogarla en 
            //su correspondiente estructura de directorio
            $this->url = 'images/'.$date->getTimestamp().  '.' . $extension;  
            
            $this->base64_to_file($params['photo_base64']['file'], $this->url);
        }

        if ($insert) { // create
            
        } else { // update
            $contest_result = ContestResult::find()->where(['image_id' => $this->id])->one();
            $antValue = self::find()->where(['id'=> $this->id])->one();
            if ($contest_result != NULL){ 
                $date   = new \DateTime();
                $date   = $date->format("Y");
                $seccion = Section::find()->where(['id' => $contest_result->section_id])->one();

                $this->code = rand(1000,9999).'_'.$date.'_'.$contest_result->contest_id.'_'.$seccion->name.'_'.$this->id;
                
                $directory = 'images';
                //si ya hay categoria definida, nos aseguramos que exista su correspondiente directorio
                $profile_contest = ProfileContest::find()->where(['profile_id' => $this->profile_id])->one();
                $category = Category::find()->where(['id' => $profile_contest->category_id])->one();
                $this->category = $category->name;
                
                if ($this->category != NULL){
                    $directory .= '/'.$this->category;
                    if (!file_exists($directory)){
                        mkdir($directory);
                    }
                }

                //nos aseguramos de que exista el directorio de la seccion, esto se usa para catalogar las imagenes
                $directory .= '/'.$seccion->name;
                if (!file_exists($directory)){
                    mkdir($directory);
                }
                //nos aseguramos de mantener consistencia entre nombres de archivo y codigo
                if (!empty($this->url) && file_exists($antValue->url)) {
                    $full_path = $directory.'/'. $this->code .  '.jpg';
                    rename($antValue->url, $full_path);
                    $this->url = $full_path;
                }
            }
        }
        return parent::beforeSave($insert);
    }

    public function afterSave($insert, $changedAttributes) {
        $params = Yii::$app->getRequest()->getBodyParams();

        //Generaciòn de miniaturas
        if (isset($params['photo_base64'])) {
            $img_name     = $this->url;
            $this->generateThumbnails('', $img_name, 'images/thumbnails/');
        }
        return parent::afterSave($insert, $changedAttributes);
    }

    protected function generateThumbnails($d_base, $img_name, $d_thumbnails){
        $thumbTypes = ThumbnailType::find()->all();
        
        for ($c=0; $c < count($thumbTypes); $c++ ){
            $imgResult = $this->newResizedImage(
                $img_name,
                $d_base.$img_name,
                $thumbTypes[$c]->width,$thumbTypes[$c]->height
            );

            if (!isset($imgResult)){
                echo 'Error en generacion de miniatura.'.$img_name.'_';
                return false;
                //throw new \Exception('Error en generacion de miniatura.'.$img_name.'_');
            } else {
                $date   = new \DateTime();
                $thumbnailPath = $d_thumbnails.$thumbTypes[$c]->width.'_.'.$thumbTypes[$c]->height.'_'.$this->id.'_'.$date->getTimestamp();
                try {
                    imagejpeg($imgResult, $thumbnailPath);
                } catch (\Throwable $th) {
                    try {
                        imagejpeg($imgResult, "/var/www/gfc.prod-api.greenborn.com.ar/web/".$thumbnailPath);
                    } catch (\Throwable $th) {
                        echo "Error no se encuentra imagen ".$thumbnailPath." \n";
                        return false;
                    }
                }
                
                $thumb_reg                 = new Thumbnail();
                $thumb_reg->image_id       = $this->id;
                $thumb_reg->url            = $thumbnailPath;
                $thumb_reg->thumbnail_type = $thumbTypes[$c]->id;
                $thumb_reg->save(false);
            }
        }
    }

    /**
     * Gets query for [[ContestResults]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getContestResults()
    {
        return $this->hasMany(ContestResult::className(), ['image_id' => 'id']);
    }

        /**
     * Gets query for [[Profile]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getProfile()
    {
        return $this->hasOne(Profile::className(), ['id' => 'profile_id']);
    }

    public function getThumbnail()
    {
        return $this->hasOne(Thumbnail::className(), ['image_id' => 'id']);
    }

    public function extraFields() {
        return [ 'profile', 'thumbnail' ];
    }

    protected function newResizedImage($imgName, $imgPath, $xmax, $ymax){
        $ext = explode(".", $imgName);
        $ext = $ext[count($ext)-1];

        $imagen = Null;
        try {
            if($ext == "jpg" || $ext == 'JPG' || $ext == "jpe" || $ext == "jpeg")
                $imagen = imagecreatefromjpeg($imgPath);
            elseif($ext == "png")
                $imagen = imagecreatefrompng($imgPath);
            elseif($ext == "gif")
                $imagen = imagecreatefromgif($imgPath);
            elseif ($ext == "webp")
                $imagen = imagecreatefromwebp($imgPath);
            
        } catch (\Throwable $th) {
            echo $imgPath." no encontrada ";
            $imagen = Null;
        }
        
        if ($imagen == Null){
          return Null;
        }

        $x = imagesx($imagen);
        $y = imagesy($imagen);

        if($x <= $xmax && $y <= $ymax){
            return $imagen;
        }

        if($x >= $y) {
            $nuevax = $xmax;
            $nuevay = $nuevax * $y / $x;
        }
        else {
            $nuevay = $ymax;
            $nuevax = $x / $y * $nuevay;
        }

        $img2 = imagecreatetruecolor($nuevax, $nuevay);
        imagecopyresized($img2, $imagen, 0, 0, 0, 0, floor($nuevax), floor($nuevay), $x, $y);
        return $img2;
    }
}
