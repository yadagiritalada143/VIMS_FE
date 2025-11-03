import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UploadUtilityComponent } from './upload-utility.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('UploadUtilityComponent', () => {
  let component: UploadUtilityComponent;
  let fixture: ComponentFixture<UploadUtilityComponent>;
  CommonTestingModule.setUpTestBed(UploadUtilityComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadUtilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
