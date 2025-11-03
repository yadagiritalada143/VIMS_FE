import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateNewComponent } from './create-new.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CreateNewComponent', () => {
  let component: CreateNewComponent;
  let fixture: ComponentFixture<CreateNewComponent>;
  CommonTestingModule.setUpTestBed(CreateNewComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
