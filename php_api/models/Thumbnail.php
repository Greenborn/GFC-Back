<?php

namespace app\models;

use Yii;

/**
 * This is the model class for table "thumbnail".
 *
 * @property int $id
 * @property int $image_id
 * @property int $thumbnail_type
 * @property string $url
 */
class Thumbnail extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'thumbnail';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['id', 'image_id', 'thumbnail_type', 'url'], 'required'],
            [['id', 'image_id', 'thumbnail_type'], 'default', 'value' => null],
            [['id', 'image_id', 'thumbnail_type'], 'integer'],
            [['url'], 'string', 'max' => 250],
            [['id'], 'unique'],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'image_id' => 'Image ID',
            'thumbnail_type' => 'Thumbnail Type',
            'url' => 'Url',
        ];
    }
}
