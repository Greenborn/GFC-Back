<?php

namespace app\models;

use Yii;

/**
 * This is the model class for table "thumbnail_type".
 *
 * @property int $id
 * @property string|null $description
 * @property int $width
 * @property int $height
 */
class ThumbnailType extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'thumbnail_type';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['id', 'width', 'height'], 'required'],
            [['id', 'width', 'height'], 'default', 'value' => null],
            [['id', 'width', 'height'], 'integer'],
            [['description'], 'string'],
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
            'description' => 'Description',
            'width' => 'Width',
            'height' => 'Height',
        ];
    }
}
