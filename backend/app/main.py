from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator
from typing import List, Union
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title='Esophageal Screening MVP', default_response_class=JSONResponse)
cors_origins = [origin.strip() for origin in os.getenv('CORS_ORIGINS', 'https://shi-guan-ai.vercel.app,http://localhost:5173,http://127.0.0.1:5173,http://172.20.10.2:5173').split(',') if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=cors_origins, allow_methods=['*'], allow_headers=['*'])


class Assessment(BaseModel):
    age: Union[str, int, float]
    smoking: Union[str, bool]
    alcohol: Union[str, bool]
    family: Union[str, bool]
    symptoms: Union[str, List[str]]

    @field_validator('age', mode='before')
    @classmethod
    def normalize_age(cls, value):
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            return '60岁及以上' if value >= 60 else ('40–59岁' if value >= 40 else '40岁以下')
        return str(value).strip() if value is not None else value

    @field_validator('smoking', mode='before')
    @classmethod
    def normalize_smoking(cls, value):
        if value is True or (isinstance(value, str) and value.strip().lower() in {'yes', 'true', '目前吸烟'}):
            return '目前吸烟'
        if value is False or (isinstance(value, str) and value.strip().lower() in {'no', 'false', '从不吸烟'}):
            return '从不吸烟'
        return str(value).strip() if value is not None else value

    @field_validator('alcohol', mode='before')
    @classmethod
    def normalize_alcohol(cls, value):
        if value is True or (isinstance(value, str) and value.strip().lower() in {'yes', 'true', '经常饮酒'}):
            return '经常饮酒'
        if value is False or (isinstance(value, str) and value.strip().lower() in {'no', 'false', '不饮酒'}):
            return '不饮酒'
        return str(value).strip() if value is not None else value

    @field_validator('family', mode='before')
    @classmethod
    def normalize_family(cls, value):
        if value is True or (isinstance(value, str) and value.strip().lower() in {'yes', 'true', '有'}):
            return '有'
        if value is False or (isinstance(value, str) and value.strip().lower() in {'no', 'false', '没有'}):
            return '没有'
        return str(value).strip() if value is not None else value

    @field_validator('symptoms', mode='before')
    @classmethod
    def normalize_symptoms(cls, value):
        if isinstance(value, list):
            return '没有' if not value else ('有多项或持续加重' if len(value) > 1 else '有其中一项')
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {'yes', 'true'}:
                return '有其中一项'
            if normalized in {'no', 'false'}:
                return '没有'
            return value.strip()
        return value


@app.get('/api/health')
def health():
    return {'status': 'ok', 'service': 'esophageal-screening'}


@app.get('/api/questionnaire')
def questionnaire():
    return {'version': '0.1-demo', 'disclaimer': '研究/演示原型，不用于临床诊断'}


@app.post('/api/assessment')
def assessment(data:Assessment):
    score = 0
    factors = []
    rules = [
        ('age', '60岁及以上', 20, '年龄因素'),
        ('smoking', '目前吸烟', 20, '吸烟相关因素'),
        ('alcohol', '经常饮酒', 15, '饮酒相关因素'),
        ('family', '有', 25, '家族史因素'),
        ('symptoms', '有多项或持续加重', 20, '症状因素'),
    ]
    for field, value, points, label in rules:
        if getattr(data, field) == value:
            score += points
            factors.append(label)
    level = '低风险' if score < 25 else ('中风险' if score < 50 else '较高风险')
    rec = ['保持均衡饮食，避免过烫食物，维持健康生活方式。']
    if data.symptoms != '没有':
        rec.append('如症状持续、明显或进行性加重，建议尽快咨询专业医疗人员。')
    else:
        rec.append('可结合个人情况向专业医疗人员了解适宜的筛查建议。')

    return JSONResponse(content={
        'risk_level': level,
        'risk_score': score,
        'factors': factors,
        'recommendations': rec,
        'disclaimer': '研究/演示原型，不用于临床诊断。',
    })
