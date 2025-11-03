import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QualificationItemsComponent } from './qualification-items.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('QualificationItemsComponent', () => {
  let component: QualificationItemsComponent;
  let fixture: ComponentFixture<QualificationItemsComponent>;
  CommonTestingModule.setUpTestBed(QualificationItemsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(QualificationItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
