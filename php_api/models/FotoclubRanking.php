<?php

namespace app\models;

use Yii;

/**
 * This is the model class for table "fotoclub_ranking".
 *
 * @property int $id
 * @property int $fotoclub_id
 * @property string|null $name
 * @property int $score
 * @property string|null $prizes
 */
class FotoclubRanking extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'fotoclub_ranking';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['fotoclub_id', 'score'], 'required'],
            [['fotoclub_id', 'score'], 'default', 'value' => null],
            [['fotoclub_id', 'score'], 'integer'],
            [['name', 'prizes'], 'string'],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'fotoclub_id' => 'Fotoclub ID',
            'name' => 'Name',
            'score' => 'Score',
            'prizes' => 'Prizes',
        ];
    }
}
