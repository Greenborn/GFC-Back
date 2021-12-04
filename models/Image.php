<?php

namespace app\models;

use Yii;
use yii\web\UploadedFile;
use app\models\Thumbnail;
use app\models\ThumbnailType;
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
            // [['code'], 'string', 'max' => 20],
            [['title', 'url', 'code'], 'string', 'max' => 45],
            // [['image_file'], 'file', 'skipOnEmpty' => false, 'extensions' => 'png, jpg']
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
        return true;
    }

    public function beforeSave($insert) {

  

        // do transformations here

        // if ($insert) { // create
        // } else { // update
        // }
        $params = Yii::$app->getRequest()->getBodyParams();
        
        // $image = $_FILES['image_file'];
        $image = UploadedFile::getInstanceByName('image_file');
        // var_dump($_FILES);
        $date     = new \DateTime();
        $id_image = Image::find()->orderBy(['id' => SORT_DESC])->one();
        if ($id_image == Null){
            $id_image = 1;
        } else {
            $id_image = $id_image->id + 1;
        }
        
        if (isset($image)) {
            // cargar img y sobrescribir la url
            
            // $tipo   = $image['type'];
            // $tamano = $image['size'];
            // $temp   = $image['tmp_name'];
            // var_dump('si');
            // $tipo   = $image->type;
            // $tamano = $image->size;
            // $temp   = $image->tempName;
            // validar img
            // $img_name = $date->getTimestamp() . $image['name'];
            $this->code = $this->code . $date->getTimestamp();
            $img_name = $this->code;
            //Si la imagen es correcta en tamaño y tipo
            //Se intenta subir al servidor
            // $full_path = getcwd().'/user_data/'.$img_name;
            $full_path = 'images/' . $img_name .  '.' . $image->extension;
            // $full_path = 'images/' . $img_name;
            // $this->url = $full_path;

            if (!$insert) {
                if (!empty($this->url) && file_exists($this->url)) {
                    unlink($this->url);
                    $this->url = '';
                    // echo 'se elimnó la img';
                } else {
                    // echo 'no se elimnó la img';
                }
            }

            
            // try {
                // if (move_uploaded_file($temp, $full_path)) {
                $image->saveAs($full_path);
                $this->url = $full_path;

                // } else {
                    // $this->url = 'error en la carga';
                // }

                // if (!$insert) $insert = true;

            //Generaciòn de miniaturas
            $this->generateThumbnails('images/', $img_name, $image->extension, 'images/thumbnails/',$id_image);

        } else {
            $this->code = $this->code . $date->getTimestamp();
            if (file_exists($this->url)) {
                $matches = [];
                preg_match('/(.[a-zA-Z])*$/', $this->url, $matches);
                $ext = $matches[0];
                $new_url = 'images/' . $this->code . $ext;
                rename($this->url, $new_url);
                $this->url = $new_url;

                $this->generateThumbnails('images/', $this->code, $ext, 'images/thumbnails/',$id_image); 
            }
            // no se cargó la imagen
            // if ($insert)
            //     $this->url = 'no se cargó la img';
            // else
            //     $this->url ='no era inesrt';
        }
      
        
      
        return parent::beforeSave($insert);
      
    }

    protected function generateThumbnails($d_base, $img_name, $img_ext, $d_thumbnails,$id_image){
        $thumbTypes = ThumbnailType::find()->all();
        
        for ($c=0; $c < count($thumbTypes); $c++ ){
            $imgResult = $this->newResizedImage(
                $img_name.'.'.$img_ext,
                $d_base.$img_name.'.'.$img_ext,
                $thumbTypes[$c]->width,$thumbTypes[$c]->height
            );

            echo "<script>console.log( 'image result es: " . $imgResult . "' );</script>";

            if ($imgResult == Null)
                throw new \Exception('Error en generacion de miniatura.');
            else {
                $thumbnailPath = $d_thumbnails.$thumbTypes[$c]->width.'_'.$thumbTypes[$c]->height.$img_name.'.jpg';
                imagejpeg($imgResult, $thumbnailPath);
                $thumb_reg                 = new Thumbnail();
                $thumb_reg->image_id       = $id_image;
                $thumb_reg->url            = $thumbnailPath;
                $thumb_reg->thumbnail_type = $thumbTypes[$c]->id;
                $thumb_reg->save(false);
            }
        }
    }

    // public function upload()
    // {
    //     if ($this->validate()) {
    //         $this->image_file->saveAs('uploads/' . $this->image_file->baseName . '.' . $this->image_file->extension);
    //         return true;
    //     } else {
    //         return false;
    //     }
    // }

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
        if($ext == "jpg" || $ext == 'JPG' || $ext == "jpe" || $ext == "jpeg")
            $imagen = imagecreatefromjpeg($imgPath);
        elseif($ext == "png")
            $imagen = imagecreatefrompng($imgPath);
        elseif($ext == "gif")
            $imagen = imagecreatefromgif($imgPath);
        elseif ($ext == "webp")
            $imagen = imagecreatefromwebp($imgPath);
        
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
