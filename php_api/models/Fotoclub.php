<?php

namespace app\models;

use Yii;
use yii\web\UploadedFile;

/**
 * This is the model class for table "fotoclub".
 *
 * @property int $id
 * @property string|null $name
 *
 * @property Profile[] $profiles
 */
class Fotoclub extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'fotoclub';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['name', 'organization_type'], 'required'],
            [['name', 'facebook', 'instagram', 'email'], 'string', 'max' => 45],
            [['description', 'photo_url'], 'string', 'max' => 255],
            [['organization_type'], 'string', 'max' => 250],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'name' => 'Name',
            'facebook' => 'Facebook',
            'instagram' => 'Instagram',
            'email' => 'Email',
            'description' => 'Description',
            'organization_type' => 'Tipo de Organización',
            // 'photo_url' => 'Photo_url',
        ];
    }

    public function beforeDelete() {
        if (!empty($this->photo_url) && file_exists($this->photo_url)) {
            unlink($this->photo_url);
            // echo 'se elimnó la img';
        }
        return true;
    }

    private function base64_to_file($base64_string, $output_file) {
        // open the output file for writing
        $ifp = fopen( $output_file, 'wb' ); 
    
        // split the string on commas
        // $data[ 0 ] == "data:image/png;base64"
        // $data[ 1 ] == <actual base64 string>
        $data = explode( ',', $base64_string );
    
        // we could add validation here with ensuring count( $data ) > 1
        fwrite( $ifp, base64_decode( $data[ 1 ] ) );
    
        // clean up the file resource
        fclose( $ifp ); 
    
        return $output_file; 
    }

    public function beforeSave($insert) {

        $params = Yii::$app->getRequest()->getBodyParams();
        
        $date     = new \DateTime();

        if (isset($params['photo_base64'])) {
            // cargar img y sobrescribir la url
            // $tipo   = $image->type;
            // $tamano = $image->size;
            // $temp   = $image->tempName;
            // validar img
            $arr_filename = explode('.', $params['photo_base64']['name']);
            $extension = end($arr_filename);
            $img_name = normalizer_normalize(strtolower( preg_replace('/\s+/', '_', $this->name))) . '-imgOrg-' . $date->getTimestamp();
            $full_path = 'images/' . $img_name .  '.' . $extension;

            if (!$insert) {
                if (!empty($this->photo_url) && file_exists($this->photo_url)) {
                    unlink($this->photo_url);
                    $this->photo_url = '';
                    // echo 'se elimnó la img';
                } else {
                    // echo 'no se elimnó la img';
                }
            }

            $this->base64_to_file($params['photo_base64']['file'], $full_path);
            $this->photo_url = $full_path;

        } else {
            // no se cargó la imagen

            if (file_exists($this->photo_url)) {
                $img_name = normalizer_normalize(strtolower( preg_replace('/\s+/', '_', $this->name))) . '-imgOrg-' . $date->getTimestamp();
                $matches = [];
                preg_match('/(.[a-zA-Z])*$/', $this->photo_url, $matches);
                $ext = $matches[0];
                $new_url = 'images/' . $img_name . $ext;
                rename($this->photo_url, $new_url);
                $this->photo_url = $new_url;
            }
        }
        return parent::beforeSave($insert);
      
      }

      public function fields() {
        $fields = parent::fields();

        return $fields;
    }

    /**
     * Gets query for [[Profiles]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getProfiles()
    {
        return $this->hasMany(Profile::className(), ['fotoclub_id' => 'id']);
    }
}
