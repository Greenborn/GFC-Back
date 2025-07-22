<?php

namespace app\models;

use Yii;

/**
 * This is the model class for table "contests_records".
 *
 * @property int $id
 * @property string|null $url
 * @property string|null $object
 * @property int $contest_id
 *
 * @property Contest $contest
 */
class ContestRecord extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'contests_records';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['object'], 'string'],
            [['contest_id'], 'required'],
            [['contest_id'], 'integer'],
            [['url'], 'string', 'max' => 255],
            [['contest_id'], 'exist', 'skipOnError' => true, 'targetClass' => Contest::className(), 'targetAttribute' => ['contest_id' => 'id']],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'url' => 'Url',
            'object' => 'Object',
            'contest_id' => 'Contest ID',
        ];
    }

    /**
     * Gets query for [[Contest]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getContest()
    {
        return $this->hasOne(Contest::className(), ['id' => 'contest_id']);
    }
}
