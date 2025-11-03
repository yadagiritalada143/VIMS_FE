import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { NotificationCategoryComponent } from './notification-category.component';
describe('NotificationCategoryComponent', () => {
  let component: NotificationCategoryComponent;
  let fixture: ComponentFixture<NotificationCategoryComponent>;

  CommonTestingModule.setUpTestBed(NotificationCategoryComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
