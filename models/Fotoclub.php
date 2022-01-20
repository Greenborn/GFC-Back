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
            [['name'], 'required'],
            [['name', 'facebook', 'instagram', 'email'], 'string', 'max' => 45],
            [['description', 'photo_url'], 'string', 'max' => 255],
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
            'photo_url' => 'Photo_url',
        ];
    }

    public function beforeDelete() {
        if (!empty($this->photo_url) && file_exists($this->photo_url)) {
            unlink($this->photo_url);
            // echo 'se elimnó la img';
        }
        return true;
    }

    public function beforeSave($insert) {

        $params = Yii::$app->getRequest()->getBodyParams();
        
        $image = UploadedFile::getInstanceByName('photo_file');
        $date     = new \DateTime();

        if (isset($image)) {
            // cargar img y sobrescribir la url
            // $tipo   = $image->type;
            // $tamano = $image->size;
            // $temp   = $image->tempName;
            // validar img
            $img_name = $this->name . '-imgOrg-' . $date->getTimestamp();
            $full_path = 'images/' . $img_name .  '.' . $image->extension;

            if (!$insert) {
                if (!empty($this->photo_url) && file_exists($this->photo_url)) {
                    unlink($this->photo_url);
                    $this->photo_url = '';
                    // echo 'se elimnó la img';
                } else {
                    // echo 'no se elimnó la img';
                }
            }

            $image->saveAs($full_path);
            $this->photo_url = $full_path;

        } else {
            // no se cargó la imagen

            if (file_exists($this->photo_url)) {
                $img_name = $this->name . '-imgOrg-' . $date->getTimestamp();
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
