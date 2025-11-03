import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HeadingsComponent } from './headings.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('HeadingsComponent', () => {
  let component: HeadingsComponent;
  let fixture: ComponentFixture<HeadingsComponent>;
  CommonTestingModule.setUpTestBed(HeadingsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(HeadingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
